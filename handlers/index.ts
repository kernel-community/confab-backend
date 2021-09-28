import { NextFunction as Next, Response } from "express";
import { errorBuilder } from "./utils";
import {
  RequestWithPayload,
  Attendee,
  Event,
  GoogleEvent,
  GoogleAttendee,
  SlackEventMessage,
  SlackMessageBlocks,
} from "../interfaces";
import { nanoid } from "nanoid";
import db from "../services/database";
import google from "../services/google";
import slack from "../services/slack";
import * as Config from "../config/index.json";

export const responseHandler = (
  req: RequestWithPayload,
  res: Response,
  next: Next
) => {
  const msg = req.intermediatePayload ? req.intermediatePayload : [];
  res.json({
    ok: true,
    data: msg,
  });
};

export const pingHandler = (
  req: RequestWithPayload,
  res: Response,
  next: Next
) => {
  req.intermediatePayload = req.body;
  next();
};

export const pingErrorHandler = (
  req: RequestWithPayload,
  res: Response,
  next: Next
) => {
  next(errorBuilder("error message", 500, "raw log data goes here"));
};

const getEventDetailsToStore = (event: Event, hash: string | false) => {
  let e = {
    hash: hash == false ? nanoid(10) : hash,
    series: hash == false ? false : true,
    title: event.title,
    descriptionText: event.descriptionText,
    descriptionHtml: event.descriptionHtml,
    startDateTime: event.startDateTime,
    endDateTime: event.endDateTime,
    location: event.location,
    limit: event.limit,
    typeId: event.typeId,
    proposerEmail: event.proposerEmail,
    proposerName: event.proposerName
  };
  return e;
};

const getEventDetailsForGcal = (event: Event, eventNumber: number, totalEvents: number): GoogleEvent => {
  const organizer: GoogleAttendee = {
    email: event.proposerEmail,
    organizer: true,
    responseStatus: "accepted",
  };
  return {
    summary: event.title + `${totalEvents > 1 ? (` (${eventNumber} of ${totalEvents})`): ''}`,
    attendees: [organizer],
    start: {
      dateTime: event.startDateTime
    },
    end: {
      dateTime: event.endDateTime
    },
    guestsCanSeeOtherGuests: true,
    guestsCanInviteOthers: true, // @note default = true; if required, can make this a param
    location: event.location,
    description: event.descriptionText + `${
      event.proposerName?
        `\n\n${'Proposer: ' + event.proposerName}`: 
        ``
      }`
  };
};

const prepareEventURL = (hash: string | false): string => {
  return "https://juntos.kernel.community/rsvp/" + hash;
};

const prepareSlackMessage = async (
  event
): Promise<SlackEventMessage> => {
  const proposer = await db.getUser(event.proposerEmail);
  const type = await db.getType(event.typeId!);
  const title = event.title.replace(/[&\/\\#,+$~%.'":*?<>@^{}]/g, "");
  let description = event.descriptionText!
    .replace(/[&\/\\#,+()$~%.'":*?<>@^{}]/g, "")
    .substring(0, 200);
  if (description.length > 200) description += "...";

  let blocks: SlackMessageBlocks[] = [];
  blocks.push({
    type: "section",
    text: {
      type: "mrkdwn",
      text: proposer + " has proposed a new " + type?.type + "!",
    },
  });
  blocks.push({
    type: "divider",
  });
  blocks.push({
    type: "section",
    text: {
      type: "mrkdwn",
      text: title + "\n" + description,
    },
  });
  if (event.series) {
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: "*_This event is part of a series_*",
      },
    });
  }
  blocks.push({
    type: "actions",
    elements: [
      {
        type: "button",
        text: {
          type: "plain_text",
          text: "Read more",
          emoji: true,
        },
        value: "click-0",
        action_id: "actionId-0",
        url: prepareEventURL(event.hash!),
      },
    ],
  });
  return {
    blocks,
    icon: type?.emoji!,
    username: "New " + type?.type + " scheduled",
  };
};

/**
 * expects 'event' (type Event) object in body rr
 */
export const newEventHandler = async (
  req: RequestWithPayload,
  res: Response,
  next: Next
) => {
  const events: Event[] = req.body.data;
  let series: string | false = events.length > 1 ? nanoid(10) : false;

  for (let i = 0; i < events.length; i++) {
    const e = events[i];
    const eventModel = getEventDetailsToStore(e, series);
    const created = await db.createEvent(eventModel);

    if (e.createGcalEvent === true) {
      if (!e.gcalCalendar) {
        next(
          errorBuilder("google calendar id not found", 500, e.gcalCalendar)
        );
        return;
      }
      const eventGcalModel: GoogleEvent = getEventDetailsForGcal(e, i+1, events.length);
      const calEventId: string = await google.createEvent(
        eventGcalModel,
        Config.services.google.calendars[e.gcalCalendar!]
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
              "slack channel id not found in the first event in array",
              500,
              events[0].slackChannel
            )
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
          messageId
        );
      }
    }
  }
  next();
};

/**
 * expects attendee (type Attendee) obj in body
 */
export const rsvpHandler = async (
  req: RequestWithPayload,
  res: Response,
  next: Next
) => {
  const attendee: Attendee = req.body.data;
  let eventId: number[] = attendee.eventId;
  if (eventId.length < 1) {
    next(
      errorBuilder(
        "eventid array required",
        500,
        JSON.stringify(eventId)
      )
    );
    return;
  }
  for (let i = 0; i < eventId.length; i++) {
      let attendeesToStore: string[] = [];
      let attendeeEmail: string = attendee.email.toLowerCase();
      const id = Number(eventId[i]);
      const eventExistsInRsvp: boolean = await db.eventExistsInRsvp(id);
      if (eventExistsInRsvp) {
        attendeesToStore = await db.getAttendees(id);
      }
      let alreadyRsvpd:boolean = attendeesToStore.find(attendee => attendee == attendeeEmail)? true : false;
      if (!alreadyRsvpd){
        attendeesToStore.push(attendee.email);
        await db.rsvp(id, attendee.email, eventExistsInRsvp, attendeesToStore);
      }
      const eventExistsInGCal: boolean = await db.eventExistsInGCal(id);
      if (eventExistsInGCal) {
        const gCal = await db.getGCalEvent(id);
        await google.rsvp(gCal.event, gCal.calendar, attendee.email);
      }
  }
  next();
};


/**
 * return all supported event types
 */
export const eventTypesHandler = async (
  req: RequestWithPayload,
  res: Response,
  next: Next
) => {
  req.intermediatePayload = await db.getAllTypes();
  next();
}

/**
 * fetch event by id
 */
export const fetchEventHandler = async (
  req: RequestWithPayload,
  res: Response,
  next: Next
) => {
  const {hash} = req.params;
  req.intermediatePayload = await db.getEventDetails(hash)
  next();
}
