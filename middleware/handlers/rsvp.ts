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
  const { eventId } = attendee;
  if (eventId.length < 1) {
    next(
      errorBuilder(
        'eventid array required',
        500,
        JSON.stringify(eventId),
      ),
    );
    return;
  }
  const attendees = await Promise.all(eventId.map((i) => db.getAttendees(i)));
  await Promise.all(eventId.map((i, k) => {
    if (attendees[k].find((a) => a === attendee.email.toLowerCase())) return;
    return db.rsvp(
      i,
      [...attendees[k], attendee.email.toLowerCase()],
    );
  }));
  const g = await Promise.all(eventId.map((i) => db.eventExistsInGCal(i)));
  const gevents = await Promise.all(eventId.map((i, k) => (g[k] ? db.getGCalEvent(i) : null)));
  await Promise.all(
    gevents.map((e) => {
      if (!e) return;
      return google.rsvp(e.event, e.calendar, attendee.email);
    }),
  );
  next();
}
