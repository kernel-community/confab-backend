import { Request, Response, NextFunction as Next } from 'express';
import { Error } from '@app/types';
import { errorBuilder } from '@app/utils';

const errorNotFound = (req: Request, res: Response, next: Next) => {
  next(errorBuilder('Not found', 404));
};

const errorHandler = (logger) => (error: Error, req: Request, res: Response) => {
  logger.error(`${JSON.stringify(error)}`);
  res.status(error.status ? error.status : 500);
  res.json({
    ok: false,
    message: error.message ? error.message : '',
  });
};

export default (client) => {
  const { logger } = client;
  const { server } = client;
  server.use(errorNotFound);
  server.use(errorHandler(logger));
};
