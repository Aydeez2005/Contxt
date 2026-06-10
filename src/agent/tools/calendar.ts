import type { OrgIntegration } from "../../db/schema.ts";
import { getValidToken } from "../../lib/tokenRefresh.ts";

export type CalendarEvent = {
  id: string;
  title: string;
  start: string;
  end: string;
  status: "confirmed" | "tentative" | "cancelled";
};

export async function getCurrentStatus(
  calendarEmail: string,
  integrations: OrgIntegration[]
): Promise<{ status: "available" | "in_meeting" | "busy"; nextEvent: CalendarEvent | null }> {
  const integration = integrations.find((i) => i.service === "gcal");
  if (!integration) return { status: "available", nextEvent: null };

  const now = new Date().toISOString();
  const in1h = new Date(Date.now() + 60 * 60 * 1000).toISOString();

  const token = await getValidToken(integration);
  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarEmail)}/events?timeMin=${now}&timeMax=${in1h}&singleEvents=true&orderBy=startTime&maxResults=1`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (!res.ok) return { status: "available", nextEvent: null };

  const data = (await res.json()) as {
    items?: Array<{
      id: string;
      summary: string;
      start: { dateTime: string };
      end: { dateTime: string };
      status: string;
    }>;
  };

  const events = data.items ?? [];
  if (events.length === 0) return { status: "available", nextEvent: null };

  const event = events[0];
  const eventStart = new Date(event.start.dateTime).getTime();
  const eventEnd = new Date(event.end.dateTime).getTime();
  const nowMs = Date.now();

  const isOngoing = nowMs >= eventStart && nowMs <= eventEnd;
  return {
    status: isOngoing ? "in_meeting" : "busy",
    nextEvent: {
      id: event.id,
      title: event.summary,
      start: event.start.dateTime,
      end: event.end.dateTime,
      status: (event.status ?? "confirmed") as CalendarEvent["status"],
    },
  };
}
