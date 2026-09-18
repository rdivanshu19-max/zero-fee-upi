import { createFileRoute } from "@tanstack/react-router";
import { QRCodeCanvas } from "qrcode.react";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  FileText,
  Lock,
  Printer,
  QrCode,
  ArrowRight,
} from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState, type FormEvent } from "react";
import {
  MAX_TOTAL,
  buildUpiLink,
  formatINR,
  splitAmount,
  validate,
  type FieldErrors,
} from "@/lib/upi";
import { buildInvoicePdf, type InvoiceMeta, type QrItem } from "@/lib/pdf";
import { useIsMobile } from "@/hooks/use-mobile";

const TITLE = "CLOCK IT — Accept UPI payments with ₹0 fees";
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
  total: number;
  parts: number[];
};

const emptyInvoice: InvoiceMeta = {
  businessName: "",
  invoiceTitle: "Payment Invoice",
  invoiceNo: "",
  invoiceDate: "",
  customerName: "",
  details: "",
  footerNote: "",
};

function Index() {
  const [upiId, setUpiId] = useState("");
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [generated, setGenerated] = useState<Generated | null>(null);
  const [invoice, setInvoice] = useState<InvoiceMeta>(emptyInvoice);

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
      total: Number(amount),
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
            <span className="text-lg font-bold tracking-tight">CLOCK IT</span>
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
          <form onSubmit={onSubmit} noValidate className="no-print surface-card self-start p-6 sm:p-8">
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

              <Field label="Payment note" chip="Optional">
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

            <InvoiceFields value={invoice} onChange={setInvoice} />
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
              <QrSection data={generated} invoice={invoice} />
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
            CLOCK IT never touches or holds money. Payments go bank-to-bank via UPI. Nothing you type
            is sent to a server.
          </p>
          <p>
            Made with <span aria-label="love">❤️</span> by CLOCK IT
          </p>
        </div>
      </footer>
    </div>
  );
}

function InvoiceFields({
  value,
  onChange,
}: {
  value: InvoiceMeta;
  onChange: (v: InvoiceMeta) => void;
}) {
  const set = (k: keyof InvoiceMeta) => (v: string) => onChange({ ...value, [k]: v });
  return (
    <details className="mt-6 rounded-xl border border-border bg-muted/40 p-4">
      <summary className="cursor-pointer text-sm font-semibold">
        Invoice &amp; branding for the PDF
        <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
          Optional
        </span>
      </summary>
      <p className="mt-2 text-xs text-muted-foreground">
        Everything here is printed on the downloadable PDF bill along with all QR codes.
      </p>
      <div className="mt-4 space-y-4">
        <Field label="Shop / business name">
          {(id) => (
            <input
              id={id}
              className="field"
              placeholder="e.g. Sharma General Store"
              maxLength={60}
              value={value.businessName}
              onChange={(e) => set("businessName")(e.target.value)}
            />
          )}
        </Field>
        <Field label="Document title">
          {(id) => (
            <input
              id={id}
              className="field"
              placeholder="Payment Invoice"
              maxLength={40}
              value={value.invoiceTitle}
              onChange={(e) => set("invoiceTitle")(e.target.value)}
            />
          )}
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Invoice no.">
            {(id) => (
              <input
                id={id}
                className="field"
                placeholder="INV-001"
                maxLength={30}
                value={value.invoiceNo}
                onChange={(e) => set("invoiceNo")(e.target.value)}
              />
            )}
          </Field>
          <Field label="Date">
            {(id) => (
              <input
                id={id}
                className="field"
                type="date"
                value={value.invoiceDate}
                onChange={(e) => set("invoiceDate")(e.target.value)}
              />
            )}
          </Field>
        </div>
        <Field label="Customer name">
          {(id) => (
            <input
              id={id}
              className="field"
              placeholder="Billed to"
              maxLength={60}
              value={value.customerName}
              onChange={(e) => set("customerName")(e.target.value)}
            />
          )}
        </Field>
        <Field label="Bill details" hint="Items, quantities, taxes — anything you want on the bill.">
          {(id) => (
            <textarea
              id={id}
              className="field min-h-28 resize-y py-3"
              placeholder={"2 x Rice bag — 1200\n1 x Oil tin — 800\nGST included"}
              maxLength={1200}
              value={value.details}
              onChange={(e) => set("details")(e.target.value)}
            />
          )}
        </Field>
        <Field label="Footer note">
          {(id) => (
            <input
              id={id}
              className="field"
              placeholder="Thank you for your business!"
              maxLength={110}
              value={value.footerNote}
              onChange={(e) => set("footerNote")(e.target.value)}
            />
          )}
        </Field>
      </div>
    </details>
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
  hint?: string | undefined;
  error?: string | undefined;
  chip?: string | undefined;
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

function QrSection({ data, invoice }: { data: Generated; invoice: InvoiceMeta }) {
  const isMobile = useIsMobile();
  const gridRef = useRef<HTMLDivElement>(null);
  const hiddenRef = useRef<HTMLDivElement>(null);
  const count = data.parts.length;

  const [paid, setPaid] = useState<boolean[]>(() => data.parts.map(() => false));
  const [active, setActive] = useState(0);

  useEffect(() => {
    setPaid(data.parts.map(() => false));
    setActive(0);
  }, [data]);

  const collected = data.parts.reduce((sum, amt, i) => (paid[i] ? sum + amt : sum), 0);
  const remaining = Math.max(0, Math.round((data.total - collected) * 100) / 100);
  const paidCount = paid.filter(Boolean).length;
  const pct = data.total > 0 ? Math.min(100, (collected / data.total) * 100) : 0;

  const links = data.parts.map((amt, i) =>
    buildUpiLink({ ...data, amount: amt, index: i + 1, count }),
  );

  function togglePaid(i: number) {
    setPaid((p) => p.map((v, j) => (j === i ? !v : v)));
  }

  function canvasesFrom(el: HTMLElement | null) {
    return Array.from(el?.querySelectorAll("canvas") ?? []);
  }

  function downloadAll() {
    const canvases = canvasesFrom(hiddenRef.current);
    canvases.forEach((c, i) =>
      setTimeout(() => downloadCanvas(c, `clockit-qr-${i + 1}-of-${count}.png`), i * 150),
    );
  }

  function downloadPdf() {
    const canvases = canvasesFrom(hiddenRef.current);
    const items: QrItem[] = canvases.map((c, i) => ({
      index: i + 1,
      amount: data.parts[i] ?? 0,
      dataUrl: c.toDataURL("image/png"),
    }));
    const doc = buildInvoicePdf({
      meta: invoice,
      total: data.total,
      upiId: data.upiId,
      payeeName: data.name,
      note: data.note,
      items,
    });
    doc.save(`clockit-invoice-${invoice.invoiceNo.trim() || Date.now()}.pdf`);
  }

  return (
    <div>
      {/* Offscreen full set, used for PDF + download-all on every screen size */}
      <div
        ref={hiddenRef}
        aria-hidden
        className="pointer-events-none absolute -left-[9999px] top-0 h-0 overflow-hidden"
      >
        {links.map((link, i) => (
          <QRCodeCanvas key={i} value={link} size={320} level="M" marginSize={2} />
        ))}
      </div>

      <div className="no-print mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-semibold">
          {count} QR code{count === 1 ? "" : "s"} ready
        </p>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn-ghost" onClick={downloadPdf}>
            <FileText className="h-3.5 w-3.5" aria-hidden /> Download PDF bill
          </button>
          <button type="button" className="btn-ghost" onClick={downloadAll}>
            <Download className="h-3.5 w-3.5" aria-hidden /> Download all
          </button>
          <button type="button" className="btn-ghost" onClick={() => window.print()}>
            <Printer className="h-3.5 w-3.5" aria-hidden /> Print sheet
          </button>
        </div>
      </div>

      {/* Progress */}
      <div className="no-print mb-5 rounded-xl border border-border bg-muted/40 p-4">
        <div className="flex items-baseline justify-between text-sm">
          <span className="font-semibold">
            {paidCount} of {count} paid
          </span>
          <span className="text-muted-foreground tabular-nums">{Math.round(pct)}%</span>
        </div>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-border">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="mt-3 flex justify-between text-sm">
          <span className="text-muted-foreground">
            Collected <span className="font-semibold text-foreground tabular-nums">{formatINR(collected)}</span>
          </span>
          <span className="text-muted-foreground">
            Remaining <span className="font-semibold text-foreground tabular-nums">{formatINR(remaining)}</span>
          </span>
        </div>
      </div>

      {isMobile ? (
        <MobileCarousel
          data={data}
          links={links}
          active={active}
          setActive={setActive}
          paid={paid}
          togglePaid={togglePaid}
        />
      ) : (
        <div ref={gridRef} className="grid gap-4 sm:grid-cols-2">
          {data.parts.map((amt, i) => (
            <QrCard
              key={`${i}-${amt}`}
              index={i + 1}
              count={count}
              amount={amt}
              link={links[i] ?? ""}
              paid={paid[i] ?? false}
              onTogglePaid={() => togglePaid(i)}
              delay={Math.min(i, 12) * 50}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function MobileCarousel({
  data,
  links,
  active,
  setActive,
  paid,
  togglePaid,
}: {
  data: Generated;
  links: string[];
  active: number;
  setActive: (n: number) => void;
  paid: boolean[];
  togglePaid: (i: number) => void;
}) {
  const count = data.parts.length;
  const amount = data.parts[active] ?? 0;
  const remainingCodes = count - paid.filter(Boolean).length;

  return (
    <div>
      <QrCard
        key={active}
        index={active + 1}
        count={count}
        amount={amount}
        link={links[active] ?? ""}
        paid={paid[active] ?? false}
        onTogglePaid={() => togglePaid(active)}
        delay={0}
        large
      />

      <div className="no-print mt-4 flex items-center justify-between gap-3">
        <button
          type="button"
          className="btn-ghost"
          onClick={() => setActive(Math.max(0, active - 1))}
          disabled={active === 0}
          aria-label="Previous QR code"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden /> Prev
        </button>
        <p className="text-sm font-semibold tabular-nums">
          {active + 1} / {count}
        </p>
        <button
          type="button"
          className="btn-ghost"
          onClick={() => setActive(Math.min(count - 1, active + 1))}
          disabled={active === count - 1}
          aria-label="Next QR code"
        >
          Next <ChevronRight className="h-4 w-4" aria-hidden />
        </button>
      </div>

      <div className="no-print mt-3 flex flex-wrap justify-center gap-1.5">
        {data.parts.map((_, i) => (
          <button
            key={i}
            type="button"
            aria-label={`Go to QR ${i + 1}`}
            aria-current={i === active}
            onClick={() => setActive(i)}
            className={`h-7 min-w-7 rounded-md border px-1.5 text-xs font-semibold tabular-nums transition-colors ${
              paid[i]
                ? "border-primary bg-primary text-primary-foreground"
                : i === active
                  ? "border-primary bg-primary-soft text-primary"
                  : "border-border bg-card text-muted-foreground"
            }`}
          >
            {i + 1}
          </button>
        ))}
      </div>

      <p className="no-print mt-3 text-center text-xs text-muted-foreground">
        {remainingCodes === 0
          ? "All codes paid — full amount collected."
          : `${remainingCodes} code${remainingCodes === 1 ? "" : "s"} left to scan.`}
      </p>
    </div>
  );
}

function QrCard({
  index,
  count,
  amount,
  link,
  paid,
  onTogglePaid,
  delay,
  large = false,
}: {
  index: number;
  count: number;
  amount: number;
  link: string;
  paid: boolean;
  onTogglePaid: () => void;
  delay: number;
  large?: boolean;
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
      className={`animate-rise flex flex-col items-center rounded-xl border bg-card p-4 ${
        paid ? "border-primary bg-primary-soft/40" : "border-border"
      }`}
      style={{ animationDelay: `${delay}ms`, breakInside: "avoid" }}
    >
      <p className="text-sm font-semibold">
        QR {index} of {count} · <span className="tabular-nums">{formatINR(amount)}</span>
      </p>
      <div ref={ref} className="mt-3 rounded-lg bg-card p-2">
        <QRCodeCanvas
          value={link}
          size={large ? 230 : 180}
          level="M"
          marginSize={1}
          title={`UPI QR ${index} of ${count} for ${formatINR(amount)}`}
        />
      </div>

      <button
        type="button"
        className={`no-print mt-3 inline-flex h-9 items-center gap-2 rounded-lg px-3 text-xs font-semibold transition-colors ${
          paid
            ? "bg-primary text-primary-foreground"
            : "border border-border bg-card text-foreground hover:bg-muted"
        }`}
        onClick={onTogglePaid}
        aria-pressed={paid}
      >
        <Check className="h-3.5 w-3.5" aria-hidden />
        {paid ? "Paid" : "Mark as paid"}
      </button>

      <div className="no-print mt-3 flex gap-2 whitespace-nowrap">
        <button
          type="button"
          className="btn-ghost"
          onClick={() => {
            const c = ref.current?.querySelector("canvas");
            if (c) downloadCanvas(c, `clockit-qr-${index}-of-${count}.png`);
          }}
        >
          <Download className="h-3.5 w-3.5" aria-hidden /> PNG
        </button>
        <button type="button" className="btn-ghost" onClick={copy}>
          {copied ? (
            <Check className="h-3.5 w-3.5 text-primary" aria-hidden />
          ) : (
            <Copy className="h-3.5 w-3.5" aria-hidden />
          )}
          {copied ? "Copied" : "Copy link"}
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
