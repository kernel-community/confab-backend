import {Request} from 'express';
// import {Event} from "@prisma/client";
import {Event as EventModel} from '.prisma/client';
export interface Error {
  message?: string;
  status?: number;
  logData?: string;
}

export type ErrorBuilder = (
  message?: string,
  status?: number,
  logData?: string
) => Error;

export interface RequestWithPayload extends Request {
  intermediatePayload?: any;
}

export type EventType = {
  name: string;
};

export type SlackEventMessage = {
  title?: string
  description?: string | null
  startDateTime?: string
  url?: string
  blocks: SlackMessageBlocks[]
  icon: string
  username: string
};

export type SlackMessageBlocks = {
  type: string;
  elements?: object[];
  text?: object;
};

export type Event = EventModel & {
  proposerName?: string
  // services
  postOnSlack: boolean
  slackChannel?: string
  createGcalEvent: boolean
  gcalCalendar?: string
};

export type GoogleEvent = {
  summary: string
  attendees: GoogleAttendee[]
  start: GoogleDate
  end: GoogleDate
  guestsCanSeeOtherGuests: boolean
  location: string
  guestsCanInviteOthers: boolean
  description: string | null
};

export type GoogleDate = {
  dateTime: string
  timezone?: string
};

export type GoogleAttendee = {
  email: string
  organizer?: boolean
  responseStatus?: 'accepted' | 'tentative' | 'needsAction' | 'declined'
};

export type Attendee = {
  name?: string
  email: string
  eventId: number[]
  hash?: string
};
