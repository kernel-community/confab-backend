import { Router } from "express";
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
  magicLinkHandler,
  editEventHandler,
} from "../middleware";
import { prisma } from "@app/services/database";

const router = Router();

export default (client) => {
  const { server } = client;
  server.use("/", router);

  /**
   * Testing
   */
  router.get("/ping", pingHandler, responseHandler);
  router.get("/pingerror", pingErrorHandler, responseHandler);
  router.post("/ping", pingHandler, responseHandler);

  /**
   * Events
   */
  router.get("/types", eventTypesHandler, responseHandler); // get event types
  router.get("/event/:hash", fetchEventHandler, responseHandler); // get event by id
  router.get("/events", fetchAllEventsHandler, responseHandler); // fetch all events (type = live / upcoming / past)
  router.post("/new", newEventHandler, responseHandler);
  router.post("/edit/:hash", editEventHandler, responseHandler);
  // create magic link to edit event with hash
  router.get("/magic/:hash", magicLinkHandler, responseHandler);

  router.get("/getAllEvents", async( req,res) => {
    const data = await prisma.event.findMany({
      include: {
        proposer: true,
        RSVP: true,
        GoogleCalendar: true
      }
    });
    res.json({
      ok: true,
      data,
    });
  })

  /**
   * router.post('/event/archive', archiveEventHandler, responseHandler);
   */ // @todo: add event to archive

  /**
   * RSVP
   */
  router.post("/rsvp", rsvpHandler, responseHandler);

  /**
   * User
   */
  router.get("/user", fetchUserHandler, responseHandler); // get user details
  router.post("/user", updateUserHandler, responseHandler); // update user details

  return router;
};
