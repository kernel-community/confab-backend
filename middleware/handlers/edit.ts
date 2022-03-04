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
  const existingHashes = await Promise.all(events.map((e) => db.getEventHash(e.id)));
  existingHashes.forEach((existingHash) => {
    if (existingHash !== hash) {
      return next(errorBuilder("hash mismatch", 403, JSON.stringify({existingHash, hash})));
    }
  });
  try {
    const updatedEvents = await Promise.all(events.map((e) => db.updateEvent(e.id, e)));
    const gcalEvents = await Promise.all(events.map((e) => db.getGCalEvent(e.id)));
    const gCalToUpdate = await Promise.all((events.map((e, k) => getEventDetailsForGcal(updatedEvents[k], k+1, events.length))))
    await Promise.all(events.map((_, k) => google.updateEvent(gcalEvents[k].calendar, gcalEvents[k].event, gCalToUpdate[k])));
  } catch(err) {
    return next(err);
  }
  req.intermediatePayload = {
    id: eventId,
    hash: hash,
  };
  next();
};
