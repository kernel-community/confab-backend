import prisma from "./client";
import { Event } from "../../interfaces";
import { EventType, Event as EventSchema } from ".prisma/client";
class Database {
  public prisma = prisma;
  public disconnect = () => prisma.$disconnect();
  public createEvent = async (e): Promise<{ id: number }> => {
    const r = await prisma.event.create({
      data: {
        title: e.title,
        descriptionHtml: e.descriptionHtml,
        descriptionText: e.descriptionText,
        startDateTime: e.startDateTime,
        endDateTime: e.endDateTime,
        location: e.location,
        hash: e.hash!,
        series: e.series,
        limit: e.limit ? e.limit : 0,
        type: {
          connect: { id: e.typeId ? e.typeId : 1 },
        },
        proposer: {
          connectOrCreate: {
            create: {
              email: e.proposerEmail,
              firstName: e.proposerName,
            },
            where: {
              email: e.proposerEmail
            }
          },
        },
      },
      select: {
        id: true,
      },
    });
    return r;
  };
  public createGCalEvent = async (
    eventId: number,
    calendarId: string,
    calEventId: string
  ): Promise<void> => {
    await prisma.googleCalendar.create({
      data: {
        event: {
          connect: { id: eventId },
        },
        gCalCalendarId: calendarId,
        gCalEventId: calEventId,
      },
    });
  };
  public createSlackMessage = async (
    eventId: number,
    channelId: string,
    messageId: string
  ): Promise<void> => {
    await prisma.slack.create({
      data: {
        event: {
          connect: { id: eventId },
        },
        channelId,
        messageId,
      },
    });
  };
  public getUser = async (email: string) => {
    const name = await prisma.user.findUnique({
      where: { email },
      select: { firstName: true },
    });
    return name?.firstName;
  };
  public getType = async (id: number) => {
    const t = await prisma.eventType.findUnique({
      where: { id },
      select: { type: true, emoji: true },
    });
    return t;
  };
  public rsvp = async (
    eventId: number,
    email: string,
    exists: boolean,
    attendees: string[]
  ): Promise<void> => {
    if (exists) {
      await prisma.rSVP.update({
        where: { eventId },
        data: { attendees },
      });
    } else {
      await prisma.rSVP.create({
        data: {
          event: { connect: { id: eventId } },
          attendees,
        },
      });
    }
  };
  public getAttendees = async (eventId: number): Promise<string[]> => {
    let rsvp = await prisma.rSVP.findFirst({
      where: { eventId },
    });
    return rsvp!.attendees;
  };
  public getEventIdByHash = async (hash: string): Promise<number> => {
    const event = await prisma.event.findFirst({
      where: { hash },
    });
    return event!.id;
  };
  public eventExistsInRsvp = async (id: number): Promise<boolean> => {
    const exists = await prisma.rSVP.findFirst({
      where: { eventId: id },
    });
    return exists === null ? false : true;
  };
  public eventExistsInGCal = async (id: number): Promise<boolean> => {
    const e = await prisma.googleCalendar.findFirst({
      where: { eventId: id },
    });
    return e === null ? false : true;
  };
  public getGCalEvent = async (
    id: number
  ): Promise<{ event: string; calendar: string }> => {
    const gcal = await prisma.googleCalendar.findUnique({
      where: { eventId: id },
    });
    return {
      event: gcal?.gCalEventId!,
      calendar: gcal?.gCalCalendarId!,
    };
  };
  public getAllTypes = async(): Promise<EventType[]> => {
    const types = await prisma.eventType.findMany();
    return types;
  }
  public getEventDetails = async(hash: string): Promise<EventSchema[]> => {
    const events = await prisma.event.findMany({
      where: { hash },
      include: {
        proposer: true,
        type: true,
        RSVP: true
      },
      orderBy: {
        startDateTime: 'asc'
      }
    })
    return events;
  }
}

export default new Database();