import { format, parseISO, isValid } from "date-fns";

/** Display format: DD-MMM-YY (e.g. 26-Jan-25) */
export const DISPLAY_DATE = "dd-MMM-yy";

export function formatDisplayDate(value: string | Date | null | undefined): string {
  if (value == null || value === "") return "—";
  let d: Date;
  if (value instanceof Date) {
    d = value;
  } else {
    const s = value.length === 10 ? `${value}T12:00:00` : value;
    d = parseISO(s);
  }
  if (!isValid(d)) return String(value);
  return format(d, DISPLAY_DATE);
}

/** Date (DD-MMM-YY) + time for timestamps */
export function formatDisplayDateTime(value: string | Date | null | undefined): string {
  if (value == null || value === "") return "—";
  const d = value instanceof Date ? value : parseISO(value);
  if (!isValid(d)) return String(value);
  return `${format(d, DISPLAY_DATE)}, ${format(d, "h:mm a")}`;
}
