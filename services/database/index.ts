import prisma from './client';
import {EventType, Event as EventSchema} from '.prisma/client';
class Database {
  public prisma = prisma;
  public disconnect = () => prisma.$disconnect();
  public createEvent = async (e): Promise<{ id: number, hash: string, type: EventType }> => {
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
          connect: {id: e.typeId ? e.typeId : 1},
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
  public createGCalEvent = async (
      eventId: number,
      calendarId: string,
      calEventId: string,
  ): Promise<void> => {
    await prisma.googleCalendar.create({
      data: {
        event: {
          connect: {id: eventId},
        },
        gCalCalendarId: calendarId,
        gCalEventId: calEventId,
      },
    });
  };
  public createSlackMessage = async (
      eventId: number,
      channelId: string,
      messageId: string,
  ): Promise<void> => {
    await prisma.slack.create({
      data: {
        event: {
          connect: {id: eventId},
        },
        channelId,
        messageId,
      },
    });
  };
  public getUserName = async (email: string) => {
    const name = await prisma.user.findUnique({
      where: {email},
      select: {firstName: true},
    });
    return name?.firstName;
  };
  public getUser = (email: string) => prisma.user.findUnique({
    where: {email},
  });
  public updateUser = (email, data) => prisma.user.upsert({
    where: {email},
    update: data,
    create: {
      email,
      ...data,
    },
  })
  public getType = async (id: number) => {
    const t = await prisma.eventType.findUnique({
      where: {id},
      select: {type: true, emoji: true},
    });
    return t;
  };
  public rsvp = async (
      eventId: number,
      email: string,
      exists: boolean,
      attendees: string[],
  ): Promise<void> => {
    if (exists) {
      await prisma.rSVP.update({
        where: {eventId},
        data: {attendees},
      });
    } else {
      await prisma.rSVP.create({
        data: {
          event: {connect: {id: eventId}},
          attendees,
        },
      });
    }
  };
  public getAttendees = async (eventId: number): Promise<string[]> => {
    const rsvp = await prisma.rSVP.findFirst({
      where: {eventId},
    });
    return rsvp!.attendees;
  };
  public getEventIdByHash = async (hash: string): Promise<number> => {
    const event = await prisma.event.findFirst({
      where: {hash},
    });
    return event!.id;
  };
  public eventExistsInRsvp = async (id: number): Promise<boolean> => {
    const exists = await prisma.rSVP.findFirst({
      where: {eventId: id},
    });
    return exists === null ? false : true;
  };
  public eventExistsInGCal = async (id: number): Promise<boolean> => {
    const e = await prisma.googleCalendar.findFirst({
      where: {eventId: id},
    });
    return e === null ? false : true;
  };
  public getGCalEvent = async (
      id: number,
  ): Promise<{ event: string; calendar: string }> => {
    const gcal = await prisma.googleCalendar.findUnique({
      where: {eventId: id},
    });
    return {
      event: gcal?.gCalEventId!,
      calendar: gcal?.gCalCalendarId!,
    };
  };
  public getAllTypes = async (): Promise<EventType[]> => {
    const types = await prisma.eventType.findMany();
    return types;
  }
  public getEventDetails = async (hash: string): Promise<EventSchema[]> => {
    const events = await prisma.event.findMany({
      where: {hash},
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
  }

  public getAllEvents = async ({
    type = 'all',
    take = 6,
    skip,
  } : {
    type?: 'live' | 'upcoming' | 'past' | 'all',
    take?: number,
    skip?: number
  }) => {
    let events;
    switch (type) {
      case 'live':
        events = await prisma.event.findMany({
          take,
          skip,
          where: {
            startDateTime: {
              lte: new Date(), // starting before or now
            },
            endDateTime: {
              gte: new Date(), // ending after or now
            },
          },
          include: {
            _count: {
              select: {
                RSVP: true,
              },
            },
          },
          distinct: ['hash'],
        });
        break;
      case 'past':
        events = await prisma.event.findMany({
          take,
          skip,
          where: {
            startDateTime: {
              lt: new Date(), // started before now
            },
            endDateTime: {
              lt: new Date(), // ended before now
            },
          },
          include: {
            _count: {
              select: {
                RSVP: true,
              },
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
          take,
          skip,
          where: {
            startDateTime: {
              gt: new Date(), // starting after but not now
            },
            endDateTime: {
              gt: new Date(), // ending after now
            },
          },
          include: {
            _count: {
              select: {
                RSVP: true,
              },
            },
          },
          distinct: ['hash'],
          orderBy: {
            startDateTime: 'asc',
          },
        });
        break;
      case 'all':
        events = await prisma.event.findMany({
          take,
          skip,
          include: {
            _count: {
              select: {
                RSVP: true,
              },
            },
          },
          distinct: ['hash'],
        });
        break;
    }
    // @todo: fix this hack
    // events = events.map((e) => Object.assign(e, {_count: e['_count']['RSVP']}));
    events.forEach((e) => delete Object.assign(e, {['RSVP']: e['_count']['RSVP']})['_count']);
    return events;
  }
}

export default new Database();
