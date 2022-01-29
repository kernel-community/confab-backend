import { RequestWithPayload } from '@app/types';
import { NextFunction as Next, Response } from 'express';
import db from '@app/services/database';

export const eventTypesHandler = async (
  req: RequestWithPayload,
  res: Response,
  next: Next,
) => {
  req.intermediatePayload = await db.getAllTypes();
  next();
};
