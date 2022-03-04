import { NextFunction as Next, Response } from "express";
import { RequestWithPayload } from "@app/types";
import * as Config from "@app/config/index.json";
import { getEventDetails } from "@app/services/database";
import google from "@app/services/google";
import {
  errorBuilder,
  generateEmail,
  magicMessage,
  hashSha256,
} from "@app/utils";
import convoUrl from "@app/utils/convoUrl";

const domain = Config.magic.email.domain;
const subject = Config.magic.email.subject;
const text = Config.magic.email.text;
const secret: string = process.env["MAGIC_SECRET"] as string;

export const magicLinkHandler = async (
  req: RequestWithPayload,
  res: Response,
  next: Next
) => {
  try {
    const { hash } = req.params;
    const events = await getEventDetails(hash);
    const event = events[0];
    const eventHash = event.hash;
    const to = event.proposerEmail;

    const ts = Date.now();
    const message = magicMessage(eventHash, ts, secret);
    const url = `${convoUrl}/edit/${eventHash}?magic=${hashSha256(
      message
    )}&ts=${ts}`;
    const body = `${text} ${url}`;
    const email = generateEmail(to, subject + ` ${event.title}`, body);
    await google.send(email);
    req.intermediatePayload = { email: email };
    next();
  } catch (e) {
    next(e);
  }
};
