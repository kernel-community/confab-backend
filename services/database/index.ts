import { EventType, Event as EventSchema, RSVP } from '.prisma/client';
import { DateTime } from 'luxon';
import Prisma from './client';

export const prisma = Prisma;
export const disconnect = () => prisma.$disconnect();
export const createEvent = async (
  e
): Promise<{ id: number; hash: string; type: EventType }> => {
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
            email: e.proposerEmail,
          },
        },
      },
    },
    select: {
      id: true,
      hash: true,
      type: true,
    },
  });
  return r;
};

export const createGCalEvent = async (
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
export const createSlackMessage = async (
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

export const getUserName = async (email: string) => {
  const name = await prisma.user.findUnique({
    where: { email },
    select: { firstName: true },
  });
  return name?.firstName;
};

export const getUser = (email: string) =>
  prisma.user.findUnique({
    where: { email },
  });

export const updateUser = (email, data) =>
  prisma.user.upsert({
    where: { email },
    update: data,
    create: {
      email,
      ...data,
    },
  });
export const getType = async (id: number) => {
  const t = await prisma.eventType.findUnique({
    where: { id },
    select: { type: true, emoji: true },
  });
  return t;
};

export const rsvp = async (
  eventId: number,
  attendees: string[],
): Promise<RSVP> => prisma.rSVP.upsert({
  update: {
    attendees,
  },
  where: {
    eventId,
  },
  create: {
    event: { connect: { id: eventId } },
    attendees,
  },
});

export const getAttendees = async (eventId: number): Promise<string[]> => {
  const rsvp = await prisma.rSVP.findFirst({
    where: { eventId },
  });
  return rsvp ? rsvp.attendees : [];
};

export const getEventIdByHash = async (hash: string): Promise<number> => {
  const event = await prisma.event.findFirst({
    where: { hash },
  });
  return event!.id;
};

export const getEventHash = async (id: number): Promise<string> => {
  const event = await prisma.event.findFirst({
    where: { id },
  });
  return event!.hash;
};

export const eventExistsInRsvp = async (id: number): Promise<boolean> => {
  const exists = await prisma.rSVP.findFirst({
    where: { eventId: id },
  });
  return exists !== null;
};

export const eventExistsInGCal = async (id: number): Promise<boolean> => {
  const e = await prisma.googleCalendar.findFirst({
    where: { eventId: id },
  });
  return e !== null;
};

export const getGCalEvent = async (
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

export const getAllTypes = async (): Promise<EventType[]> => {
  const types = await prisma.eventType.findMany();
  return types;
};

export const getEventDetails = async (hash: string): Promise<EventSchema[]> => {
  const events = await prisma.event.findMany({
    where: { hash },
    include: {
      proposer: true,
      type: true,
      RSVP: true,
    },
    orderBy: {
      startDateTime: "asc",
    },
  });
  return events;
};
export const getAllEvents = async ({
  type,
  take = 6,
  skip,
  now,
  fromId = undefined,
  types,
}: {
  type: "live" | "upcoming" | "past" | "today" | "week" | "month";
  take?: number;
  skip?: number;
  now: Date;
  fromId?: number | undefined;
  types?: number[];
}) => {
  let events: any;
  const Now = new Date(now);
  const tomorrow12Am = DateTime.fromJSDate(Now)
    .plus({ days: 1 })
    .startOf("day")
    .toJSDate();
  const sevenDaysFromNow = DateTime.fromJSDate(Now)
    .plus({ days: 7 })
    .toJSDate();
  const startOfNextMonth = DateTime.fromJSDate(Now)
    .plus({ months: 1 })
    .startOf("month")
    .toJSDate();
  const cursorObj = fromId ? { id: fromId } : undefined;
  const noTypesFilter = types && types.length === 0;
  const typeId = noTypesFilter
    ? {}
    : {
        typeId: {
          in: types,
        },
      };
  const includes = {
    take,
    skip,
    include: {
      type: true,
      proposer: true,
      RSVP: true,
    },
    cursor: cursorObj,
  };
  switch (type) {
    case "live":
      events = await prisma.event.findMany({
        ...includes,
        where: {
          startDateTime: {
            gte: Now,
          },
          endDateTime: {
            lt: Now,
          },
          ...typeId,
        },
        orderBy: {
          startDateTime: "asc",
        },
        distinct: ["hash"],
      });
      break;
    case "past":
      events = await prisma.event.findMany({
        ...includes,
        where: {
          startDateTime: {
            lt: Now, // started before now
          },
          endDateTime: {
            lt: Now, // ended before now
          },
          ...typeId,
        },
        distinct: ["hash"],
        orderBy: {
          startDateTime: "desc",
        },
      });
      break;
    case "upcoming":
      events = await prisma.event.findMany({
        ...includes,
        where: {
          startDateTime: {
            gt: Now, // starting after but not now
          },
          endDateTime: {
            gt: Now, // ending after now
          },
          ...typeId,
        },
        distinct: ["hash"],
        orderBy: {
          startDateTime: "asc",
        },
      });
      break;
    case "today":
      events = await prisma.event.findMany({
        ...includes,
        where: {
          startDateTime: {
            gte: Now,
          },
          endDateTime: {
            lt: tomorrow12Am,
          },
          ...typeId,
        },
        distinct: ["hash"],
        orderBy: {
          startDateTime: "asc",
        },
      });
      break;
    case "week":
      events = await prisma.event.findMany({
        ...includes,
        where: {
          startDateTime: {
            gte: tomorrow12Am,
          },
          endDateTime: {
            lt: sevenDaysFromNow,
          },
          ...typeId,
        },
        distinct: ["hash"],
        orderBy: {
          startDateTime: "asc",
        },
      });
      break;
    case "month":
      events = await prisma.event.findMany({
        ...includes,
        where: {
          startDateTime: {
            gte: Now,
          },
          endDateTime: {
            lt: startOfNextMonth,
          },
          ...typeId,
        },
        distinct: ["hash"],
        orderBy: {
          startDateTime: "asc",
        },
      });
      break;
    default:
      return;
  }

  events.forEach((e) =>
    Object.assign(e, { RSVP: e.RSVP[0]?.attendees.length })
  );
  events.forEach(
    (e) =>
      delete Object.assign(e, { proposerName: e.proposer.firstName }).proposer
  );
  // eslint-disable-next-line consistent-return
  return events;
};

export const updateEvent = async (id: number, data) =>
  prisma.event.update({
    where: { id },
    data,
  });
