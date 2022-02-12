import { NextFunction as Next, Response } from "express";
import { nanoid } from "nanoid";
import {
  RequestWithPayload,
  Event,
  GoogleEvent,
  SlackEventMessage,
} from "@app/types";
import * as Config from "@app/config/index.json";
import * as db from "@app/services/database";
import google from "@app/services/google";
import slack from "@app/services/slack";
import {
  getEventDetailsToStore,
  errorBuilder,
  getEventDetailsForGcal,
  prepareSlackMessage,
  magicMessage,
  hashSha256,
} from "@app/utils";

const ONE_HOUR = 60 * 60 * 1000;
const secret = process.env["MAGIC_SECRET"];
const isExpired = (ts) => Date.now() - ts > ONE_HOUR;
const magicHashMatch = (magicHash, eventHash, ts, secret) =>
  hashSha256(magicMessage(eventHash, ts, secret)) === magicHash;

export const editEventHandler = async (
  req: RequestWithPayload,
  res: Response,
  next: Next
) => {
  const ts: string = req.query.ts as string;
  const magic: string = req.query.magic as string;
  const { hash } = req.params;
  const events: Event[] = req.body.data;

  if (isExpired(parseInt(ts))) {
    console.debug("link expired");
    return next(errorBuilder("link expired", 403, `${hash}, ${magic}, ${ts}`));
  }

  if (!magicHashMatch(magic, hash, ts, secret)) {
    console.debug("hash mismatch");
    return next(
      errorBuilder("wrong magic hash", 403, `${hash}, ${magic}, ${ts}`)
    );
  }

  let eventId;
  for (let i = 0; i < events.length; i++) {
    const e = events[i];
    const eventModel = getEventDetailsToStore(e, hash);
    delete eventModel.proposerName;
    try {
      eventId = await db.getEventIdByHash(hash);
      const updatedEvent = await db.updateEvent(eventId, eventModel);
    } catch (e) {
      console.debug("error updating db");
      return next(errorBuilder("error updating db", 500, JSON.stringify(e)));
    }

    try {
      const calendarEvent = await db.getGCalEvent(eventId);
      const eventGcalModel: GoogleEvent = await getEventDetailsForGcal(
        eventModel,
        i + 1,
        events.length
      );
      const calEventId: string = await google.updateEvent(
        eventGcalModel,
        Config.services.google.calendars[e.gcalCalendar!]
      );
    } catch (e) {
      console.debug("error updating gcal");
      return next(errorBuilder("error updating gcal", 500, JSON.stringify(e)));
    }
  }
  req.intermediatePayload = {
    id: eventId,
    hash: hash,
  };
  next();
};
