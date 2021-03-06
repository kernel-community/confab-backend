import { RequestWithPayload } from '@app/types';
import { NextFunction as Next, Response } from 'express';
import * as db from '@app/services/database';

export const fetchUserHandler = async (
  req: RequestWithPayload,
  res: Response,
  next: Next,
) => {
  // @ts-ignore
  const { email }: {email: string} = req.query;
  req.intermediatePayload = await db.getUser(email);
  next();
};

export const updateUserHandler = async (
  req: RequestWithPayload,
  res: Response,
  next: Next,
) => {
  const { data } = req.body;
  const { email } = data;
  const payload = {
    username: data.username || '',
    firstName: data.name || '',
  };
  req.intermediatePayload = await db.updateUser(email, payload);
  next();
};
