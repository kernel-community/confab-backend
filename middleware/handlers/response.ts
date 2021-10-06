import {RequestWithPayload} from 'types';
import {NextFunction as Next, Response} from 'express';

export default function responseHandler(
    req: RequestWithPayload,
    res: Response,
    next: Next,
) {
  const msg = req.intermediatePayload ? req.intermediatePayload : [];
  res.json({
    ok: true,
    data: msg,
  });
};
