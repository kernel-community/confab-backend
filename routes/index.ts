import { Router } from "express";
import {
  pingErrorHandler,
  pingHandler,
  responseHandler,
  newEventHandler,
  rsvpHandler,
  eventTypesHandler,
  fetchEventHandler
} from "../handlers";

const router = Router();

export default (client) => {
  const { server } = client;
  server.use("/", router);

  router.get("/ping", pingHandler, responseHandler);
  router.get("/pingerror", pingErrorHandler, responseHandler);
  router.post("/ping", pingHandler, responseHandler);

  router.post("/new", newEventHandler, responseHandler);
  router.post("/rsvp", rsvpHandler, responseHandler);
  
  // get event types 
  router.get("/types", eventTypesHandler, responseHandler);
  // update an event
  // router.post('/update',eventUpdateHandler, responseHandler);

  // login
  // router.post('/access', accessHandler, responseHandler);

  // get all events (with pagination)
  // router.get('/events', fetchEventsHandler, responseHandler);

  // get event by id
  router.get('/event/:hash', fetchEventHandler, responseHandler);

  // get event by hash
  // router.get('/event/hash/:hash', fetchEventHandler, responseHandler);
  return router;
};
