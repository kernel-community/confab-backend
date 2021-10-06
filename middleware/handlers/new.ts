import {RequestWithPayload} from 'types';
import {NextFunction as Next, Response} from 'express';
import {nanoid} from 'nanoid';
import {
  Event,
  GoogleEvent,
  SlackEventMessage,
} from '../../types';
import db from '../../services/database';
import google from '../../services/google';
import slack from '../../services/slack';
import * as Config from '../../config/index.json';

import {
  getEventDetailsToStore,
  errorBuilder,
  getEventDetailsForGcal,
  prepareSlackMessage,
} from '../utils';

export default async function newEventHandler(
    req: RequestWithPayload,
    res: Response,
    next: Next,
) {
  const events: Event[] = req.body.data;
  const series: string | false = events.length > 1 ? nanoid(10) : false;

  for (let i = 0; i < events.length; i++) {
    const e = events[i];
    const eventModel = getEventDetailsToStore(e, series);
    const created = await db.createEvent(eventModel);

    if (e.createGcalEvent === true) {
      if (!e.gcalCalendar) {
        next(
            errorBuilder('google calendar id not found', 500, e.gcalCalendar),
        );
        return;
      }
      const eventGcalModel: GoogleEvent = await getEventDetailsForGcal(e, i+1, events.length);
      const calEventId: string = await google.createEvent(
          eventGcalModel,
          Config.services.google.calendars[e.gcalCalendar!],
      );
      await db.createGCalEvent(
          created.id,
          Config.services.google.calendars[e.gcalCalendar!],
          calEventId);
    }
    if (i==0) {
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
        const messageId: string = await slack.sendEventMessage(
            slackMessage,
            Config.services.slack.channels[events[i].slackChannel!],
        );
        await db.createSlackMessage(
            created.id,
            Config.services.slack.channels[events[0].slackChannel!],
            messageId,
        );
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
