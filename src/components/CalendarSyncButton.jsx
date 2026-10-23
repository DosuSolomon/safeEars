import React from "react";
import { CalendarPlus, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

function toGCalDate(iso) {
  return new Date(iso)
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}Z$/, "Z");
}

export default function CalendarSyncButton({ session, isSeeker }) {
  const [done, setDone] = React.useState(false);

  const start = session.started_at ? new Date(session.started_at) : new Date();
  const end = session.ended_at
    ? new Date(session.ended_at)
    : new Date(start.getTime() + (session.duration_seconds || 30 * 60) * 1000);

  const title = `SafeEars session — ${session.topic_name || "Support"}`;
  const details = `Private ${session.session_type || "text"} session on SafeEars.${
    isSeeker && session.listener_name
      ? `\nListener: ${session.listener_name}.`
      : ""
  }${!isSeeker && session.seeker_nickname ? `\nSeeker: ${session.seeker_nickname}.` : ""}\nThis is a confidential support session.`;

  const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
    title,
  )}&dates=${toGCalDate(start.toISOString())}/${toGCalDate(end.toISOString())}&details=${encodeURIComponent(
    details,
  )}&ctz=UTC`;

  const open = () => {
    window.open(url, "_blank", "noopener,noreferrer");
    setDone(true);
    setTimeout(() => setDone(false), 2500);
  };

  return (
    <Button variant="outline" size="sm" onClick={open}>
      {done ? (
        <>
          <Check className="h-4 w-4 mr-1.5" /> Opened
        </>
      ) : (
        <>
          <CalendarPlus className="h-4 w-4 mr-1.5" /> Add to Google Calendar
        </>
      )}
    </Button>
  );
}
