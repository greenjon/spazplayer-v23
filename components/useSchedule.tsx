import { useEffect, useState } from "react";

interface RawShow {
  start_timestamp: number; // milliseconds
  end_timestamp: number;   // milliseconds
  name: string;
  url: string;
}

export interface ScheduleItem {
  datePart: string;
  startTime: string;
  endTime: string;
  showName: string;
}

// Decode HTML entities like &#039;
function decodeHtmlEntities(text: string) {
  const txt = document.createElement("textarea");
  txt.innerHTML = text;
  return txt.value;
}

// Format: Weekday mm-dd h:mm AM/PM – h:mm AM/PM — Show Name
function formatTimeWithLowercaseMeridiem(date: Date) {
  const hours24 = date.getHours();
  const minutes = date.getMinutes();

  const isPM = hours24 >= 12;
  const hours12 = hours24 % 12 || 12;

  const paddedHours = String(hours12).padStart(2, "0");
  const paddedMinutes = String(minutes).padStart(2, "0");
  const meridiem = isPM ? "p" : "a";

  return `${paddedHours}:${paddedMinutes}${meridiem}`;
}

// Create structured object: { datePart, startTime, endTime, showName }
function formatShowItem(startMs: number, endMs: number, name: string): ScheduleItem {
  const start = new Date(startMs);
  const end = new Date(endMs);

  const weekday = start.toLocaleDateString(undefined, { weekday: "short" });
  const month = start.toLocaleDateString(undefined, { month: "2-digit" });
  const day = start.toLocaleDateString(undefined, { day: "2-digit" });

  const startTime = formatTimeWithLowercaseMeridiem(start);
  const endTime = formatTimeWithLowercaseMeridiem(end);

  const cleanName = decodeHtmlEntities(name);

  return {
    datePart: `${weekday} ${month}-${day}`,
    startTime: startTime,
    endTime: endTime,
    showName: cleanName
  };
}


export function useSchedule() {
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function fetchSchedule() {
      try {
        if (mounted) setLoading(true);

        const response = await fetch("https://radio.spaz.org/djdash/droid");

        if (!response.ok) {
          throw new Error(`HTTP error ${response.status}`);
        }

        const data: RawShow[] = await response.json();

        const formatted = data.map(show =>
          formatShowItem(
            show.start_timestamp,
            show.end_timestamp,
            show.name
          )
        );

        if (mounted) {
          setSchedule(formatted);
          setLoading(false);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to load schedule');
          setLoading(false);
        }
      }
    }

    fetchSchedule();

    return () => {
      mounted = false;
    };
  }, []);

  return { schedule, loading, error };
}