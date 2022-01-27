import {RequestWithPayload} from 'types';
import {NextFunction as Next, Response} from 'express';
import db from '../../services/database';

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
  }: {
    type: 'live' | 'upcoming' | 'past' | 'all',
    take?:number,
    skip?:number
  } = req.query;
  req.intermediatePayload = await db.getAllEvents({type, take, skip});
  console.log(req.intermediatePayload);
  next();
};

export const fetchEventHandler = async (
    req: RequestWithPayload,
    res: Response,
    next: Next,
) => {
  const {hash} = req.params;
  req.intermediatePayload = await db.getEventDetails(hash);
  next();
};
