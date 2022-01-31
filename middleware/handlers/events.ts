import { RequestWithPayload } from 'types';
import { NextFunction as Next, Response } from 'express';
import * as db from '@app/services/database';

export const fetchAllEventsHandler = async (
  req: RequestWithPayload,
  res: Response,
  next: Next,
) => {
  // @ts-ignore
  const {
    type,
    take,
    skip,
    now,
  }: {
    type: 'live' | 'upcoming' | 'past' | 'today' | 'week' | 'month',
    take?:number,
    skip?:number,
    now: Date
  } = req.query;
  req.intermediatePayload = await db.getAllEvents({
    type, take: take ? Number(take) : undefined, skip: skip ? Number(skip) : undefined, now,
  });
  next();
};

export const fetchEventHandler = async (
  req: RequestWithPayload,
  res: Response,
  next: Next,
) => {
  const { hash } = req.params;
  req.intermediatePayload = await db.getEventDetails(hash);
  next();
};
