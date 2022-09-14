import {data} from "./convo-backup.json";
import {prisma} from "../services/database"
const events = data.Event;

(async() => {
  for (let i = 0; i < events.length; i++) {
    const {
      id, createdAt, title, startDateTime, endDateTime, descriptionText, descriptionHtml, location, hash, series, limit, typeId, proposerEmail
    } = events[i];

    const createdEvent = await prisma.event.create({
      data: {
        createdAt: new Date(createdAt),
        title,
        startDateTime: new Date(startDateTime),
        endDateTime: new Date(endDateTime),
        descriptionHtml,
        descriptionText,
        location,
        hash,
        series,
        limit,
        type: {
          connectOrCreate: {
            where: {
              id: typeId
            },
            create: {
              id: typeId,
              type: typeId === 2 ? "Guild" : typeId === 3 ? "Offer": typeId === 1 ? "Junto" : "Interview",
              emoji: ":coffee:"
            }
          }
        },
        proposer: {
          connectOrCreate: {
            where: {
              email: proposerEmail
            },
            create:{
              email: proposerEmail,
              username: proposerEmail.split("@")[0]
            }
          }
        }
      },
      select: {
        id: true
      }
    })

    console.log("created", {title, id: createdEvent.id});

    if (events[i]["RSVPs"].length === 0) continue;

    for (let j = 0; j < events[i]["RSVPs"][0]["attendees"].length; j++) {
      try {
        await prisma.rSVP.create({
          data: {
            event: {
              connect: {
                id: createdEvent.id
              }
            },
            attendee: {
              connect: {
                email: events[i]["RSVPs"][0]["attendees"][j]
              }
            }
          }
        })
      } catch {}
    }
    if (events[i]["GoogleCalendars"].length === 0) continue;
    await prisma.googleCalendar.create({
      data: {
        gCalCalendarId: events[i].GoogleCalendars[0]["gCalCalendarId"],
        gCalEventId: events[i].GoogleCalendars[0]["gCalEventId"],
        event: {
          connect: {
            id: createdEvent.id
          }
        }
      }
    })
    if(events[i]["Slacks"].length === 0) continue;
    await prisma.slack.create({
      data: {
        event: {
          connect: {
            id: createdEvent.id
          }
        },
        messageId: events[i]["Slacks"][0]["messageId"],
        channelId: events[i]["Slacks"][0]["channelId"]
      }
    })
  }

})()
