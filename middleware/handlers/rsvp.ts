/* eslint-disable consistent-return */
import { RequestWithPayload, Attendee } from '@app/types';
import { NextFunction as Next, Response } from 'express';
import { errorBuilder } from '@app/utils';
import * as db from '@app/services/database';
import google from '@app/services/google';

export default async function rsvpHandler(
  req: RequestWithPayload,
  res: Response,
  next: Next,
) {
  const attendee: Attendee = req.body.data;
  const { events } = attendee;
  if (events.length < 1) {
    next(
      errorBuilder(
        'eventid array required',
        500,
        JSON.stringify(events),
      ),
    );
    return;
  }
  await Promise.all(events.map((i) => {
    return db.rsvp(
      i,
      attendee.name,
      attendee.email.toLowerCase(),
    );
  }));
  // google event rsvp
  const g = await Promise.all(events.map((event) => db.eventExistsInGCal(event)));
  const gevents = await Promise.all(events.map((i, k) => (g[k] ? db.getGCalEvent(i) : null)));
  await Promise.all(
    gevents.map((e) => {
      if (!e) return;
      return google.rsvp(e.event, e.calendar, attendee.email);
    }),
  );
  next();
}
