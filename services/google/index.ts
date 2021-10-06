import {getAuth} from './auth';
import {google} from 'googleapis';
import {GoogleEvent} from 'types';

class GoogleService {
  getCalendar = async () => {
    let auth;
    try {
      auth = await getAuth();
    } catch (e) {
      console.log('error in auth', e);
    }
    const calendar = google.calendar({version: 'v3', auth});
    return calendar;
  };
  public createEvent = async (
      event: GoogleEvent,
      calendarId: string,
  ): Promise<string> => {
    const calendar = await this.getCalendar();
    const e = await calendar.events.insert({
      calendarId,
      requestBody: event,
    });
    if (!e.data.id) {
      throw new Error('Error in creating event');
    }
    return e.data.id!;
  };
  public getEvent = async (calendarId: string, eventId: string) => {
    const calendar = await this.getCalendar();
    return (
      await calendar.events.get({
        calendarId,
        eventId,
      })
    ).data;
  };
  public rsvp = async (
      eventId: string,
      calendarId: string,
      email: string,
  ): Promise<void> => {
    const calendar = await this.getCalendar();
    const event = await this.getEvent(calendarId, eventId);
    const attendees = event.attendees ? event.attendees : [];
    const alreadyRsvpd:boolean = attendees.find((attendee) => attendee.email == email)? true : false;
    if (!alreadyRsvpd) {
      attendees.push({
        email,
        responseStatus: 'accepted',
      });
      await calendar.events.update({
        calendarId,
        eventId,
        requestBody: {
          summary: event.summary,
          creator: event.creator,
          start: event.start,
          end: event.end,
          attendees,
          guestsCanInviteOthers: event.guestsCanInviteOthers,
          guestsCanSeeOtherGuests: event.guestsCanSeeOtherGuests,
          location: event.location,
          description: event.description,
        },
        sendUpdates: 'all',
      });
    }
  };
}

export default new GoogleService();
