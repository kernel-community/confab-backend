import { NextFunction as Next, Response } from "express";
import {
  RequestWithPayload,
  Event,
  GoogleEvent,
} from "@app/types";
import * as Config from "@app/config/index.json";
import * as db from "@app/services/database";
import google from "@app/services/google";
import {
  errorBuilder,
  getEventDetailsForGcal,
  magicMessage,
  hashSha256,
} from "@app/utils";

const TIMEOUT = Config.magic.timeoutMinutes * 60 * 1000;
const secret = process.env["MAGIC_SECRET"];
const isExpired = (ts) => Date.now() - ts > TIMEOUT;
const magicHashMatch = (magicHash, eventHash, ts, secret) =>
  hashSha256(magicMessage(eventHash, ts, secret)) === magicHash;

export const editEventHandler = async (
  req: RequestWithPayload,
  res: Response,
  next: Next
) => {
  const ts: string = req.body.ts as string;
  const magic: string = req.body.magic as string;
  const { hash } = req.params;
  const events: Event[] = JSON.parse(req.body.data);
  console.log({ts, magic, hash, events});
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
    eventId = e.id;
    const existingHash = await db.getEventHash(eventId);
    if (existingHash !== hash) {
      return next(errorBuilder("hash mismatch", 403, JSON.stringify(e)));
    }
    let updatedEvent;
    try {
      updatedEvent = await db.updateEvent(eventId, e);
    } catch (e) {
      console.debug("error updating db", e);
      return next(errorBuilder("error updating db", 500, JSON.stringify(e)));
    }

    try {
      const calendarEvent = await db.getGCalEvent(eventId);
      console.debug(calendarEvent);
      const eventGcalModel: GoogleEvent = await getEventDetailsForGcal(
        updatedEvent,
        i + 1,
        events.length
      );
      const calEventId: string = await google.updateEvent(
        calendarEvent.calendar,
        calendarEvent.event,
        eventGcalModel
      );
    } catch (e) {
      console.debug("error updating gcal", e);
      return next(errorBuilder("error updating gcal", 500, JSON.stringify(e)));
    }
  }
  req.intermediatePayload = {
    id: eventId,
    hash: hash,
  };
  next();
};
