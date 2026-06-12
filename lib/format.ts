// Central date/currency formatting. IMPORTANT: plain "ar-SA" defaults to the
// islamic-umalqura (Hijri) calendar and Eastern Arabic digits — always go
// through these helpers, never call toLocaleDateString ad hoc.

const AR_GREGORIAN = "ar-SA-u-ca-gregory-nu-latn";
const TIME_ZONE = "Asia/Riyadh";

const dateFmt = new Intl.DateTimeFormat(AR_GREGORIAN, {
  dateStyle: "medium",
  timeZone: TIME_ZONE,
});

const dateTimeFmt = new Intl.DateTimeFormat(AR_GREGORIAN, {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: TIME_ZONE,
});

const sarFmt = new Intl.NumberFormat("ar-SA-u-nu-latn", {
  style: "currency",
  currency: "SAR",
  maximumFractionDigits: 0,
});

const numberFmt = new Intl.NumberFormat("ar-SA-u-nu-latn");

export function formatDate(value: Date | string | null | undefined): string {
  if (!value) return "—";
  return dateFmt.format(new Date(value));
}

export function formatDateTime(value: Date | string | null | undefined): string {
  if (!value) return "—";
  return dateTimeFmt.format(new Date(value));
}

export function formatSAR(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return sarFmt.format(value);
}

export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return numberFmt.format(value);
}

// For <input type="date"> default values.
export function toInputDate(value: Date | string | null | undefined): string {
  if (!value) return "";
  return new Date(value).toISOString().slice(0, 10);
}
