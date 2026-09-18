import { createFileRoute } from "@tanstack/react-router";
import { QRCodeCanvas } from "qrcode.react";
import { Check, Copy, Download, Lock, Printer, QrCode, ArrowRight } from "lucide-react";
import { useId, useMemo, useRef, useState, type FormEvent } from "react";
import {
  MAX_TOTAL,
  buildUpiLink,
  formatINR,
  splitAmount,
  validate,
  type FieldErrors,
} from "@/lib/upi";

const TITLE = "one999 — Accept UPI payments with ₹0 fees";
const DESCRIPTION =
  "Split any amount into UPI QR codes of ₹1,999 or less so customers can pay the full total. Generated entirely on-device — no fees, no accounts, no servers.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: TITLE },
      { name: "twitter:description", content: DESCRIPTION },
    ],
  }),
  component: Index,
});

type Generated = {
  upiId: string;
  name: string;
  note: string;
  parts: number[];
};

function Index() {
  const [upiId, setUpiId] = useState("");
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [generated, setGenerated] = useState<Generated | null>(null);

  const liveTotal = /^\d+(\.\d{1,2})?$/.test(amount.trim()) ? Number(amount) : 0;
  const liveParts = useMemo(() => splitAmount(liveTotal), [liveTotal]);
  const validTotal = liveTotal > 0 && liveTotal <= MAX_TOTAL;

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const errs = validate({ upiId, name, amount });
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setGenerated({
      upiId: upiId.trim(),
      name: name.trim(),
      note: note.trim(),
      parts: splitAmount(Number(amount)),
    });
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="no-print border-b border-border bg-card/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <QrCode className="h-5 w-5" aria-hidden />
            </span>
            <span className="text-lg font-bold tracking-tight">one999</span>
            <span className="hidden h-5 w-px bg-border sm:block" aria-hidden />
            <span className="hidden text-sm text-muted-foreground sm:block">Accept UPI payments</span>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
            <Lock className="h-3 w-3" aria-hidden />
            On-device
          </span>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6 sm:py-14">
        <section className="no-print mb-10 max-w-2xl">
          <h1 className="text-3xl font-bold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
            Collect the full amount. Pay ₹0 fees.
          </h1>
          <p className="mt-4 text-base text-muted-foreground sm:text-lg">
            Accept UPI payments directly, with no setup or transaction fees.
          </p>
        </section>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-8">
          <form onSubmit={onSubmit} noValidate className="no-print surface-card p-6 sm:p-8">
            <h2 className="text-lg font-bold">Payment details</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Add your UPI details and the full amount you're owed.
            </p>

            <div className="mt-6 space-y-5">
              <Field label="Your UPI ID" error={errors.upiId}>
                {(id, invalid) => (
                  <input
                    id={id}
                    className="field"
                    placeholder="name@bank"
                    autoComplete="off"
                    autoCapitalize="none"
                    spellCheck={false}
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    aria-invalid={invalid}
                  />
                )}
              </Field>

              <Field label="Account holder name" error={errors.name}>
                {(id, invalid) => (
                  <input
                    id={id}
                    className="field"
                    placeholder="Full name"
                    maxLength={100}
                    autoComplete="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    aria-invalid={invalid}
                  />
                )}
              </Field>

              <hr className="border-border" />

              <Field
                label="Full amount to collect"
                error={errors.amount}
                hint="Maximum ₹1,99,900 · Up to 100 QR codes"
              >
                {(id, invalid) => (
                  <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-sm font-medium text-muted-foreground">
                      ₹
                    </span>
                    <input
                      id={id}
                      className="field pl-9 pr-14 tabular-nums"
                      placeholder="0.00"
                      inputMode="decimal"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      aria-invalid={invalid}
                    />
                    <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4 text-xs font-semibold tracking-wide text-muted-foreground">
                      INR
                    </span>
                  </div>
                )}
              </Field>

              <Field
                label="Payment note"
                chip="Optional"
              >
                {(id) => (
                  <input
                    id={id}
                    className="field"
                    placeholder="e.g. Invoice 001"
                    maxLength={60}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  />
                )}
              </Field>

              <button type="submit" className="btn-primary w-full">
                Generate QR codes
                <ArrowRight className="h-4 w-4" aria-hidden />
              </button>

              <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                <Lock className="h-3 w-3" aria-hidden />
                Payment details never leave your browser.
              </p>
            </div>
          </form>

          <section className="surface-card p-6 sm:p-8" aria-live="polite">
            <h2 className="text-lg font-bold">Payment summary</h2>

            <div className="mt-6">
              <p className="text-sm text-muted-foreground">Total to collect</p>
              <p className="mt-1 text-4xl font-extrabold tracking-tight tabular-nums sm:text-5xl">
                {formatINR(validTotal ? liveTotal : 0)}
              </p>
            </div>

            <dl className="mt-6 divide-y divide-border text-sm">
              <div className="flex items-center justify-between py-3">
                <dt className="text-muted-foreground">QR codes</dt>
                <dd className="font-semibold tabular-nums">{validTotal ? liveParts.length : "—"}</dd>
              </div>
              <div className="flex items-center justify-between py-3">
                <dt className="text-muted-foreground">Amount per QR</dt>
                <dd className="font-semibold">Up to ₹1,999</dd>
              </div>
            </dl>

            <hr className="my-6 border-border" />

            {generated ? (
              <QrGrid data={generated} />
            ) : (
              <div className="flex flex-col items-center rounded-xl border border-dashed border-border px-6 py-12 text-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary-soft text-primary">
                  <QrCode className="h-7 w-7" aria-hidden />
                </span>
                <p className="mt-4 font-semibold">Collect every part of the payment</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Generate QR codes of ₹1,999 or less.
                </p>
                <p className="text-sm text-muted-foreground">
                  Your customer pays each code to cover the full amount.
                </p>
              </div>
            )}
          </section>
        </div>
      </main>

      <footer className="no-print border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>
            one999 never touches or holds money. Payments go bank-to-bank via UPI. Nothing you type is
            sent to a server.
          </p>
          <p>
            Made with <span aria-label="love">❤️</span> by one999
          </p>
        </div>
      </footer>
    </div>
  );
}

function Field({
  label,
  hint,
  error,
  chip,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  chip?: string;
  children: (id: string, invalid: boolean) => React.ReactNode;
}) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 flex items-center gap-2 text-sm font-semibold">
        {label}
        {chip && (
          <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
            {chip}
          </span>
        )}
      </label>
      {children(id, Boolean(error))}
      {error ? (
        <p className="mt-1.5 text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

function QrGrid({ data }: { data: Generated }) {
  const gridRef = useRef<HTMLDivElement>(null);
  const count = data.parts.length;

  function downloadAll() {
    const canvases = gridRef.current?.querySelectorAll("canvas") ?? [];
    canvases.forEach((c, i) => setTimeout(() => downloadCanvas(c, `one999-qr-${i + 1}-of-${count}.png`), i * 150));
  }

  return (
    <div>
      <div className="no-print mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-semibold">
          {count} QR code{count === 1 ? "" : "s"} ready
        </p>
        <div className="flex gap-2">
          <button type="button" className="btn-ghost" onClick={downloadAll}>
            <Download className="h-3.5 w-3.5" aria-hidden /> Download all
          </button>
          <button type="button" className="btn-ghost" onClick={() => window.print()}>
            <Printer className="h-3.5 w-3.5" aria-hidden /> Print sheet
          </button>
        </div>
      </div>
      <div ref={gridRef} className="grid gap-4 sm:grid-cols-2">
        {data.parts.map((amt, i) => (
          <QrCard
            key={`${i}-${amt}`}
            index={i + 1}
            count={count}
            amount={amt}
            link={buildUpiLink({ ...data, amount: amt, index: i + 1, count })}
            delay={Math.min(i, 12) * 50}
          />
        ))}
      </div>
    </div>
  );
}

function QrCard({
  index,
  count,
  amount,
  link,
  delay,
}: {
  index: number;
  count: number;
  amount: number;
  link: string;
  delay: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <div
      className="animate-rise flex flex-col items-center rounded-xl border border-border bg-card p-4"
      style={{ animationDelay: `${delay}ms`, breakInside: "avoid" }}
    >
      <p className="text-sm font-semibold">
        QR {index} of {count} · <span className="tabular-nums">{formatINR(amount)}</span>
      </p>
      <div ref={ref} className="mt-3 rounded-lg bg-card p-2">
        <QRCodeCanvas
          value={link}
          size={180}
          level="M"
          marginSize={1}
          title={`UPI QR ${index} of ${count} for ${formatINR(amount)}`}
        />
      </div>
      <div className="no-print mt-3 flex gap-2">
        <button
          type="button"
          className="btn-ghost"
          onClick={() => {
            const c = ref.current?.querySelector("canvas");
            if (c) downloadCanvas(c, `one999-qr-${index}-of-${count}.png`);
          }}
        >
          <Download className="h-3.5 w-3.5" aria-hidden /> Download PNG
        </button>
        <button type="button" className="btn-ghost" onClick={copy}>
          {copied ? (
            <Check className="h-3.5 w-3.5 text-primary" aria-hidden />
          ) : (
            <Copy className="h-3.5 w-3.5" aria-hidden />
          )}
          {copied ? "Copied" : "Copy UPI link"}
        </button>
      </div>
    </div>
  );
}

function downloadCanvas(canvas: HTMLCanvasElement, filename: string) {
  const a = document.createElement("a");
  a.href = canvas.toDataURL("image/png");
  a.download = filename;
  a.click();
}
