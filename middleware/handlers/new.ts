import {
  RequestWithPayload,
  Event,
  GoogleEvent,
  SlackEventMessage,
} from '@app/types';
import { NextFunction as Next, Response } from 'express';
import { nanoid } from 'nanoid';
import * as db from '@app/services/database';
import google from '@app/services/google';
import slack from '@app/services/slack';
import * as Config from '@app/config/index.json';
import {
  getEventDetailsToStore,
  errorBuilder,
  getEventDetailsForGcal,
  prepareSlackMessage,
} from '@app/utils';

export const newEventHandler = async (
  req: RequestWithPayload,
  res: Response,
  next: Next,
) => {
  const events: Event[] = req.body.data;
  const series: string | false = events.length > 1 ? nanoid(10) : false;

  for (let i = 0; i < events.length; i++) {
    const e = events[i];
    const hash: string | false = e.hash ? e.hash : series;
    const eventModel = getEventDetailsToStore(e, hash);
    let created;
    try {
      created = await db.createEvent(eventModel);
    } catch (e) {
      console.log('[api/new] error in creating a new event', e);
      next(
        errorBuilder(
          '[api/new] error in creating a new event',
          500,
          JSON.stringify(e),
        ),
      );
    }

    if (e.createGcalEvent === true) {
      if (!e.gcalCalendar) {
        next(
          errorBuilder('google calendar id not found', 500, e.gcalCalendar),
        );
        return;
      }
      try {
        const eventGcalModel: GoogleEvent = await getEventDetailsForGcal(eventModel, i + 1, events.length);
        const calEventId: string = await google.createEvent(
          eventGcalModel,
          Config.services.google.calendars[e.gcalCalendar!],
        );
        await db.createGCalEvent(
          created.id,
          Config.services.google.calendars[e.gcalCalendar!],
          calEventId,
        );
      } catch (e) {
        console.log(e);
        next(errorBuilder('error in creating event', 500, JSON.stringify(e)));
      }
    }
    if (i === 0) {
      let slackMessage: SlackEventMessage;
      if (events[i].postOnSlack === true) {
        slackMessage = await prepareSlackMessage(eventModel);
        if (!events[i].slackChannel) {
          next(
            errorBuilder(
              'slack channel id not found in the first event in array',
              500,
              events[0].slackChannel,
            ),
          );
          return;
        }
        try {
          const messageId: string = await slack.sendEventMessage(
            slackMessage,
            Config.services.slack.channels[events[i].slackChannel!],
          );
          await db.createSlackMessage(
            created.id,
            Config.services.slack.channels[events[0].slackChannel!],
            messageId,
          );
        } catch (e) {
          next(
            errorBuilder(
              'error in sending to slack',
              500,
              JSON.stringify(e),
            ),
          );
        }
      }
    }
    req.intermediatePayload = {
      id: created.id,
      hash: created.hash,
      type: created.type,
    };
  }
  next();
};
