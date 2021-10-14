import {Response, NextFunction as Next} from 'express';
import {RequestWithPayload} from 'types';

import db from '../../services/database';

export default async function(
    req: RequestWithPayload,
    res: Response,
    next: Next,
) {
  const {data} = req.body;
  const email = data.email;
  const payload = {
    username: data.username || '',
    firstName: data.name || '',
  };
  req.intermediatePayload = await db.updateUser(email, payload);
  next();
}
