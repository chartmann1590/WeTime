import * as ical from 'node-ical';
import { createEvents, EventAttributes } from 'ics';
import { RRule, RRuleSet, rrulestr } from 'rrule';

export function parseIcs(text: string) {
  const data = ical.sync.parseICS(text);
  const events: Array<{
    uid?: string;
    title: string;
    description?: string;
    location?: string;
    dtstart: Date;
    dtend: Date;
    rrule?: string;
    exdates?: string[];
  }> = [];
  for (const k of Object.keys(data)) {
    const ev = data[k];
    if (ev.type === 'VEVENT') {
      const exdates = ev.exdate ? Object.values(ev.exdate).map((d: any) => new Date(d).toISOString().slice(0, 10)) : [];
      events.push({
        uid: ev.uid,
        title: ev.summary || 'Untitled',
        description: ev.description,
        location: ev.location,
        dtstart: new Date(ev.start),
        dtend: new Date(ev.end),
        rrule: ev.rrule ? ev.rrule.toString() : undefined,
        exdates,
      });
    }
  }
  return events;
}

export function toIcs(events: EventAttributes[]) {
  const { error, value } = createEvents(events);
  if (error) throw error;
  return value;
}

export function expandRecurrence(rruleString?: string, exdates: string[] = [], between: { start: Date; end: Date } = { start: new Date(0), end: new Date(8640000000000000) }) {
  if (!rruleString) return [] as Date[];
  const set = new RRuleSet();
  const rule = rrulestr(rruleString) as RRule;
  set.rrule(rule);
  for (const ex of exdates) set.exdate(new Date(ex));
  return set.between(between.start, between.end, true);
}

