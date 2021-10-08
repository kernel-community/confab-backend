import {Router} from 'express';
import {
  pingErrorHandler,
  pingHandler,
  responseHandler,
  newEventHandler,
  rsvpHandler,
  eventTypesHandler,
  fetchEventHandler,
  fetchUserHandler,
  updateUserHandler,
} from '../middleware';

const router = Router();

export default (client) => {
  const {server} = client;
  server.use('/', router);

  router.get('/ping', pingHandler, responseHandler);
  router.get('/pingerror', pingErrorHandler, responseHandler);
  router.post('/ping', pingHandler, responseHandler);

  router.post('/new', newEventHandler, responseHandler);
  router.post('/rsvp', rsvpHandler, responseHandler);

  // get event types
  router.get('/types', eventTypesHandler, responseHandler);

  // get event by id
  router.get('/event/:hash', fetchEventHandler, responseHandler);

  // get user details
  router.get('/user/:email', fetchUserHandler, responseHandler);

  // update user details
  router.post('/user', updateUserHandler, responseHandler);

  return router;
};
