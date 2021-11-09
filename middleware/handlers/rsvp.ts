import {RequestWithPayload} from 'types';
import {NextFunction as Next, Response} from 'express';
import {Attendee} from '../../types';
import {errorBuilder} from '../utils';
import db from '../../services/database';
import google from '../../services/google';

export default async function rsvpHandler(
    req: RequestWithPayload,
    res: Response,
    next: Next,
) {
  const attendee: Attendee = req.body.data;
  const eventId: number[] = attendee.eventId;
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
  for (let i = 0; i < eventId.length; i++) {
    let attendeesToStore: string[] = [];
    const attendeeEmail: string = attendee.email.toLowerCase();
    const id = Number(eventId[i]);
    const eventExistsInRsvp: boolean = await db.eventExistsInRsvp(id);
    if (eventExistsInRsvp) {
      attendeesToStore = await db.getAttendees(id);
    }
    const alreadyRsvpd:boolean = attendeesToStore.find((attendee) => attendee == attendeeEmail)? true : false;
    if (!alreadyRsvpd) {
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
