import {RequestWithPayload} from 'types';
import {NextFunction as Next, Response} from 'express';
import db from '../../services/database';

export default async function fetchEventHandler(
    req: RequestWithPayload,
    res: Response,
    next: Next,
) {
  const {hash} = req.params;
  req.intermediatePayload = await db.getEventDetails(hash);
  next();
}
