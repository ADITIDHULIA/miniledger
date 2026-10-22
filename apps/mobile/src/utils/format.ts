const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Format integer paise as INR with Indian digit grouping: 12345600 -> ₹1,23,456 ; 125050 -> ₹1,250.50 */
export function formatINR(paise: number): string {
  const sign = paise < 0 ? "-" : "";
  const abs = Math.abs(Math.round(paise));
  const rupees = String(Math.floor(abs / 100));
  const fraction = abs % 100;
  const last3 = rupees.slice(-3);
  const rest = rupees.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ",");
  const grouped = rest ? `${rest},${last3}` : last3;
  return `${sign}₹${grouped}${fraction ? `.${String(fraction).padStart(2, "0")}` : ""}`;
}

/** "2026-10-05T..." -> "5 Oct 2026" (device local time) */
export function formatDate(iso: string | Date): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

/** Local calendar date as YYYY-MM-DD (what the API expects for due dates). */
export function toDateOnly(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
