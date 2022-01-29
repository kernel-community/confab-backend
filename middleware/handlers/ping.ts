import { RequestWithPayload } from '@app/types';
import { NextFunction as Next, Response } from 'express';
import { errorBuilder } from '@app/utils';

export const pingHandler = (
  req: RequestWithPayload,
  res: Response,
  next: Next,
) => {
  req.intermediatePayload = req.body;
  next();
};

export const pingErrorHandler = (
  req: RequestWithPayload,
  res: Response,
  next: Next,
) => {
  next(errorBuilder('error message', 500, 'raw log data goes here'));
};
