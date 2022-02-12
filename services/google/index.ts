/* eslint-disable no-invalid-this */
import { google } from "googleapis";
import { GoogleEvent } from "types";
import { getAuth } from "./auth";

const getCalendar = async () => {
  let auth;
  try {
    auth = await getAuth();
  } catch (e) {
    console.log("error in auth", e);
  }
  const calendar = google.calendar({ version: "v3", auth });
  return calendar;
};

const createEvent = async (
  event: GoogleEvent,
  calendarId: string
): Promise<string> => {
  const calendar = await getCalendar();
  const e = await calendar.events.insert({
    calendarId,
    requestBody: event,
  });
  if (!e.data.id) {
    throw new Error("Error in creating event");
  }
  return e.data.id!;
};

const getEvent = async (calendarId: string, eventId: string) => {
  const calendar = await getCalendar();
  return (
    await calendar.events.get({
      calendarId,
      eventId,
    })
  ).data;
};

const updateEvent = async (event: GoogleEvent, calendarId: string) => {
  const calendar = await getCalendar();
  const e = await calendar.events.update({
    calendarId,
    requestBody: event,
  });
  if (!e.data.id) {
    throw new Error("Error in updating event");
  }
  return e.data.id!;
};

const rsvp = async (
  eventId: string,
  calendarId: string,
  email: string
): Promise<void> => {
  const calendar = await getCalendar();
  const event = await getEvent(calendarId, eventId);
  const attendees = event.attendees ? event.attendees : [];
  const alreadyRsvpd: boolean = !!attendees.find(
    (attendee) => attendee.email === email
  );
  if (!alreadyRsvpd) {
    attendees.push({
      email,
      responseStatus: "accepted",
    });
    await calendar.events.update({
      calendarId,
      eventId,
      requestBody: {
        summary: event.summary,
        creator: event.creator,
        start: event.start,
        end: event.end,
        attendees,
        guestsCanInviteOthers: event.guestsCanInviteOthers,
        guestsCanSeeOtherGuests: event.guestsCanSeeOtherGuests,
        location: event.location,
        description: event.description,
      },
      sendUpdates: "all",
    });
  }
};

export const send = async (raw: string) => {
  const auth = await getAuth();
  const gmail = google.gmail({ version: "v1", auth });
  return await gmail.users.messages.send({
    userId: "me",
    requestBody: {
      raw: raw,
    },
  });
};

export default {
  createEvent,
  getEvent,
  updateEvent,
  rsvp,
  send,
};
