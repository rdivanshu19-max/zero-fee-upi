export const MAX_PER_QR = 1999;
export const MAX_TOTAL = 199900;
export const MAX_CODES = 100;

export const UPI_ID_RE = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/;

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Split a total into parts of ≤ ₹1,999. Returns [] for invalid totals. */
export function splitAmount(total: number): number[] {
  const t = round2(total);
  if (!Number.isFinite(t) || t <= 0 || t > MAX_TOTAL) return [];
  const count = Math.ceil(t / MAX_PER_QR);
  const parts: number[] = [];
  for (let i = 0; i < count - 1; i++) parts.push(MAX_PER_QR);
  const last = round2(t - MAX_PER_QR * (count - 1));
  if (last > 0) parts.push(last);
  return parts;
}

const inr = new Intl.NumberFormat("en-IN", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatINR(n: number): string {
  return "₹" + inr.format(Number.isFinite(n) ? n : 0);
}

/** Remove control characters and trim; keeps the text plain before URL-encoding. */
export function sanitize(text: string, max: number): string {
  return text
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .trim()
    .slice(0, max);
}

export function buildUpiLink(opts: {
  upiId: string;
  name: string;
  amount: number;
  note: string;
  index: number;
  count: number;
}): string {
  const pa = sanitize(opts.upiId, 256);
  const pn = encodeURIComponent(sanitize(opts.name, 100));
  const am = round2(opts.amount).toFixed(2);
  const base = sanitize(opts.note, 60);
  const tn = encodeURIComponent(`${base ? base + " " : ""}(${opts.index}/${opts.count})`);
  return `upi://pay?pa=${encodeURIComponent(pa)}&pn=${pn}&am=${am}&cu=INR&tn=${tn}`;
}

export type FieldErrors = Partial<Record<"upiId" | "name" | "amount", string>>;

export function validate(values: { upiId: string; name: string; amount: string }): FieldErrors {
  const errors: FieldErrors = {};
  const upiId = values.upiId.trim();
  if (!upiId) errors.upiId = "Enter your UPI ID.";
  else if (!UPI_ID_RE.test(upiId)) errors.upiId = "Enter a valid UPI ID like name@bank.";

  const name = values.name.trim();
  if (!name) errors.name = "Enter the account holder name.";
  else if (name.length > 100) errors.name = "Name must be 100 characters or fewer.";

  const amtStr = values.amount.trim();
  if (!amtStr) errors.amount = "Enter the amount to collect.";
  else if (!/^\d+(\.\d{1,2})?$/.test(amtStr)) errors.amount = "Enter a number with up to 2 decimals.";
  else {
    const amt = Number(amtStr);
    if (amt <= 0) errors.amount = "Amount must be greater than ₹0.";
    else if (amt > MAX_TOTAL) errors.amount = "Maximum is ₹1,99,900.";
  }
  return errors;
}
