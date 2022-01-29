import { RequestWithPayload } from '@app/types';
import { Response } from 'express';

export default function responseHandler(
  req: RequestWithPayload,
  res: Response,
) {
  const msg = req.intermediatePayload ? req.intermediatePayload : [];
  res.json({
    ok: true,
    data: msg,
  });
}
