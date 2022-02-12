import { nanoid } from "nanoid";
import crypto from "crypto";
import {
  Event,
  GoogleEvent,
  GoogleAttendee,
  SlackMessageBlocks,
  SlackEventMessage,
  ErrorBuilder,
} from "@app/types";
import * as db from "@app/services/database";
import applicationUrl from "@app/utils/convoUrl";

export const errorBuilder: ErrorBuilder = (message, status, logData) => ({
  message,
  status,
  logData,
});

export const getEventDetailsToStore = (event: Event, hash: string | false) => {
  const e = {
    hash: hash === false ? nanoid(10) : hash,
    series: hash != false,
    title: event.title,
    descriptionText: event.descriptionText,
    descriptionHtml: event.descriptionHtml,
    startDateTime: event.startDateTime,
    endDateTime: event.endDateTime,
    location: event.location,
    limit: Number(event.limit),
    typeId: Number(event.typeId),
    proposerEmail: event.proposerEmail,
    proposerName: event.proposerName,
  };
  return e;
};

export const getEventDetailsForGcal = async (
  event,
  eventNumber: number,
  totalEvents: number
): Promise<GoogleEvent> => {
  const organizer: GoogleAttendee = {
    email: event.proposerEmail,
    organizer: true,
    responseStatus: "accepted",
  };
  const typeString = (await db.getType(Number(event.typeId!)))?.type;
  return {
    summary: `${event.title}${
      totalEvents > 1 ? ` (${eventNumber} of ${totalEvents})` : ""
    }`,
    attendees: [organizer],
    start: {
      dateTime: event.startDateTime,
    },
    end: {
      dateTime: event.endDateTime,
    },
    guestsCanSeeOtherGuests: true,
    guestsCanInviteOthers: true, // @note default = true; if required, can make this a param
    location: event.location,
    description:
      `${event.descriptionHtml}${
        event.proposerName ? `\n\n${`Proposer: ${event.proposerName}`}` : ""
      }` +
      `${`\nRSVP here: https://convo.kernel.community/rsvp/${event.hash}`}`,
  };
};

const prepareEventURL = (hash: string | false): string =>
  `${applicationUrl}/rsvp/${hash}`;

export const prepareSlackMessage = async (
  event
): Promise<SlackEventMessage> => {
  const proposer = await db.getUserName(event.proposerEmail);
  const type = await db.getType(Number(event.typeId!));
  const title = event.title.replace(/[&\/\\#+$~%'":*?<>@^{}]/g, "");
  let description = event
    .descriptionText!.replace(/[&\/\\#+$~%'":*?<>@^{}]/g, "")
    .substring(0, 200);
  if (description.length > 200) description += "...";

  const blocks: SlackMessageBlocks[] = [];
  blocks.push({
    type: "section",
    text: {
      type: "mrkdwn",
      text: `*${proposer}*` + ` has proposed a new Convo!`,
    },
  });
  blocks.push({
    type: "divider",
  });
  blocks.push({
    type: "section",
    text: {
      type: "mrkdwn",
      text: `*${title}*\n${description}`,
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
          text: Number(event.typeId!) === 3 ? "Book a Slot" : "Read more",
          emoji: true,
        },
        value: "click-0",
        action_id: "actionId-0",
        url:
          Number(event.typeId!) === 3
            ? event.location
            : prepareEventURL(event.hash!),
      },
    ],
  });
  return {
    blocks,
    icon: "speech_balloon",
    username: `New Convo Scheduled`,
  };
};

export const base64url = (b64: string): string =>
  b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");

export const generateEmail = (
  to: string,
  subject: string,
  message: string
): string => {
  let email = `To: ${to}
Subject: ${subject}
MIME-Version: 1.0
Content-Type: text/plain; charset="UTF-8"
Content-Transfer-Encoding: base64

${message}`;
  return base64url(Buffer.from(email).toString("base64"));
};

export const hashSha256 = (message: string): string =>
  base64url(crypto.createHash("sha256").update(message).digest("base64"));

export const magicMessage = (
  eventHash: string,
  ts: number,
  secret: string
): string => `${eventHash}|${ts}|${secret}`;
