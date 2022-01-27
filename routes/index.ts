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
  fetchAllEventsHandler,
} from '../middleware';

const router = Router();

export default (client) => {
  const {server} = client;
  server.use('/', router);

  /**
   * Testing
   */
  router.get('/ping', pingHandler, responseHandler);
  router.get('/pingerror', pingErrorHandler, responseHandler);
  router.post('/ping', pingHandler, responseHandler);

  /**
   * Events
   */
  router.get('/types', eventTypesHandler, responseHandler); // get event types
  router.get('/event/:hash', fetchEventHandler, responseHandler); // get event by id
  router.get('/events', fetchAllEventsHandler, responseHandler); // fetch all events (type = live / upcoming / past)
  router.post('/new', newEventHandler, responseHandler);

  /**
   * RSVP
   */
  router.post('/rsvp', rsvpHandler, responseHandler);

  /**
   * User
   */
  router.get('/user', fetchUserHandler, responseHandler); // get user details
  router.post('/user', updateUserHandler, responseHandler); // update user details

  return router;
};
