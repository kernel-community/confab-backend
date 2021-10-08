import {RequestWithPayload} from 'types';
import {NextFunction as Next, Response} from 'express';
import db from '../../services/database';

export default async function eventTypesHandler(
    req: RequestWithPayload,
    res: Response,
    next: Next,
) {
  const {email} = req.params;
  req.intermediatePayload = await db.getUser(email);
  next();
}
