import {RequestWithPayload} from 'types';
import {NextFunction as Next, Response} from 'express';
import db from '../../services/database';

export const fetchAllEventsHandler = async (
    req: RequestWithPayload,
    res: Response,
    next: Next,
) => {
  // @ts-ignore
  const {type}: {type: 'live' | 'upcoming' | 'past'} = req.query;
  req.intermediatePayload = await db.getAllEvents(type);
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
