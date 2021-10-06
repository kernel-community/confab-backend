import {RequestWithPayload} from 'types';
import {NextFunction as Next, Response} from 'express';
import db from '../../services/database';

export default async function eventTypesHandler(
    req: RequestWithPayload,
    res: Response,
    next: Next,
) {
  req.intermediatePayload = await db.getAllTypes();
  next();
}
