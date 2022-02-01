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
    fromId,
    types,
  }: {
    type: 'live' | 'upcoming' | 'past' | 'today' | 'week' | 'month',
    take?:number,
    skip?:number,
    now: Date,
    fromId?: number,
    types:string
  } = req.query;
  req.intermediatePayload = await db.getAllEvents({
    type,
    take: take ? Number(take) : undefined,
    skip: skip ? Number(skip) : undefined,
    now,
    fromId: fromId ? Number(fromId) : undefined,
    types: types.length > 0 ? types.split(',').map((t) => parseInt(t, 10)) : [],
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
