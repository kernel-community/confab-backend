import { EventType, Event as EventSchema } from '.prisma/client';
import { DateTime } from 'luxon';
import Prisma from './client';

export const prisma = Prisma;
export const disconnect = () => prisma.$disconnect();
export const createEvent = async (e): Promise<{ id: number, hash: string, type: EventType }> => {
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
  calEventId: string,
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
  messageId: string,
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

export const getUser = (email: string) => prisma.user.findUnique({
  where: { email },
});

export const updateUser = (email, data) => prisma.user.upsert({
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
  email: string,
  exists: boolean,
  attendees: string[],
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
export const getAttendees = async (eventId: number): Promise<string[]> => {
  const rsvp = await prisma.rSVP.findFirst({
    where: { eventId },
  });
  return rsvp!.attendees;
};

export const getEventIdByHash = async (hash: string): Promise<number> => {
  const event = await prisma.event.findFirst({
    where: { hash },
  });
  return event!.id;
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
  id: number,
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
      startDateTime: 'asc',
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
} : {
    type: 'live' | 'upcoming' | 'past' | 'today' | 'week' | 'month',
    take?: number,
    skip?: number,
    now: Date,
    fromId?: number | undefined,
  }) => {
  let events: any;
  const Now = new Date(now);
  const tomorrow12Am = DateTime.fromJSDate(Now).plus({ days: 1 }).startOf('day').toJSDate();
  const sevenDaysFromNow = DateTime.fromJSDate(Now).plus({ days: 7 }).toJSDate();
  const startOfNextMonth = DateTime.fromJSDate(Now).plus({ months: 1 }).startOf('month').toJSDate();
  const cursorObj = fromId ? { id: fromId } : undefined;
  const includes = {
    take,
    skip,
    include: {
      _count: {
        select: {
          RSVP: true,
        },
      },
      type: true,
      proposer: true,
    },
    cursor: cursorObj,
  };
  switch (type) {
    case 'live':
      events = await prisma.event.findMany({
        ...includes,
        where: {
          startDateTime: {
            gte: Now,
          },
          endDateTime: {
            lt: Now,
          },
        },
        orderBy: {
          startDateTime: 'asc',
        },
        distinct: ['hash'],
      });
      break;
    case 'past':
      events = await prisma.event.findMany({
        ...includes,
        where: {
          startDateTime: {
            lt: Now, // started before now
          },
          endDateTime: {
            lt: Now, // ended before now
          },
          typeId: {
            in: [1, 2],
          },
        },
        distinct: ['hash'],
        orderBy: {
          startDateTime: 'desc',
        },
      });
      break;
    case 'upcoming':
      events = await prisma.event.findMany({
        ...includes,
        where: {
          startDateTime: {
            gt: Now, // starting after but not now
          },
          endDateTime: {
            gt: Now, // ending after now
          },
        },
        distinct: ['hash'],
        orderBy: {
          startDateTime: 'asc',
        },
      });
      break;
    case 'today':
      events = await prisma.event.findMany({
        ...includes,
        where: {
          startDateTime: {
            gte: Now,
          },
          endDateTime: {
            lt: tomorrow12Am,
          },
        },
        distinct: ['hash'],
        orderBy: {
          startDateTime: 'asc',
        },
      });
      break;
    case 'week':
      events = await prisma.event.findMany({
        ...includes,
        where: {
          startDateTime: {
            gte: tomorrow12Am,
          },
          endDateTime: {
            lt: sevenDaysFromNow,
          },
        },
        distinct: ['hash'],
        orderBy: {
          startDateTime: 'asc',
        },
      });
      break;
    case 'month':
      events = await prisma.event.findMany({
        ...includes,
        where: {
          startDateTime: {
            gte: Now,
          },
          endDateTime: {
            lt: startOfNextMonth,
          },
        },
        distinct: ['hash'],
        orderBy: {
          startDateTime: 'asc',
        },
      });
      break;
    default:
      return;
  }
  // @todo: fix this hack
  // eslint-disable-next-line no-underscore-dangle
  events.forEach((e) => delete Object.assign(e, { RSVP: e._count.RSVP })._count);
  events.forEach((e) => delete Object.assign(e, { proposerName: e.proposer.firstName }).proposer);
  // eslint-disable-next-line consistent-return
  return events;
};
