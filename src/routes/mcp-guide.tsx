import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, KeyRound, LifeBuoy, Plug, QrCode, Wrench } from "lucide-react";

const SITE_URL = "https://clock-it-omega.lovable.app";
const TITLE = "CLOCK IT MCP setup guide — connect agents to UPI payment tools";
const DESCRIPTION =
  "How to connect an AI agent to the CLOCK IT MCP server: sign-in, endpoint configuration, the three UPI payment tools, and troubleshooting.";

export const Route = createFileRoute("/mcp-guide")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:site_name", content: "CLOCK IT" },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: TITLE },
      { name: "twitter:description", content: DESCRIPTION },
    ],
  }),
  component: McpGuide,
});

const tools = [
  {
    name: "split_payment_total",
    title: "Split a payment total",
    what: "Turns one rupee total into the list of amounts, each ₹1,999 or less.",
    input: `{ "total": 8500.5 }`,
    out: "Count of codes, the max per code, and every amount in order.",
  },
  {
    name: "create_upi_payment_links",
    title: "Create UPI payment links",
    what: "Builds the ready-to-scan upi:// links for the whole split.",
    input: `{
  "upiId": "shop@okaxis",
  "name": "Sharma General Store",
  "total": 8500.5,
  "note": "Invoice 001"
}`,
    out: "One link per code, with its index and amount.",
  },
  {
    name: "check_upi_id",
    title: "Check a UPI ID",
    what: "Format check for a UPI ID. It never contacts a bank.",
    input: `{ "upiId": "shop@okaxis" }`,
    out: "Whether the ID is well formed.",
  },
];

const troubles: { q: string; a: string }[] = [
  {
    q: "The client says 401 Unauthorized",
    a: "The request carried no token or an expired one. Complete the sign-in prompt again, or refresh the access token; tokens are short-lived.",
  },
  {
    q: "The client never shows a sign-in prompt",
    a: "It is not reading the discovery document. Confirm it supports OAuth for MCP and that /.well-known/oauth-protected-resource is reachable from the same host you configured.",
  },
  {
    q: "No tools appear after connecting",
    a: "Point the client at the /mcp path exactly, with no trailing slash, and reconnect so it re-lists the tools.",
  },
  {
    q: "A tool returns an input error",
    a: "total must be more than 0 and at most 1,99,900; upiId must look like name@bank; the note is capped at 60 characters.",
  },
  {
    q: "It works on the live site but not locally",
    a: "The local server has its own address, so use http://localhost:8080/mcp during development.",
  },
];

function McpGuide() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border bg-card/70 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3 sm:px-6">
          <Link to="/" className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <QrCode className="h-5 w-5" aria-hidden />
            </span>
            <span className="text-lg font-bold tracking-tight">CLOCK IT</span>
          </Link>
          <Link to="/" className="btn-ghost">
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden /> Back to app
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-10 sm:px-6 sm:py-14">
        <h1 className="text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
          Connect your AI agent to CLOCK IT
        </h1>
        <p className="mt-4 max-w-2xl text-base text-muted-foreground">
          CLOCK IT exposes its payment-splitting tools over MCP, so an assistant like Claude or any
          MCP-capable client can work out the codes for you. Nothing is stored — every answer is
          calculated from the values the client sends.
        </p>

        <Section icon={<Plug className="h-4 w-4" aria-hidden />} title="1. Endpoint configuration">
          <p>Add a remote MCP server in your client with this address:</p>
          <Code>{`${SITE_URL}/mcp`}</Code>
          <p className="mt-4">
            During local development the same server runs at <Mono>http://localhost:8080/mcp</Mono>.
            The transport is streamable HTTP, so no command or local install is needed.
          </p>
          <p className="mt-4">A typical client config file looks like this:</p>
          <Code>{`{
  "mcpServers": {
    "clock-it": {
      "url": "${SITE_URL}/mcp"
    }
  }
}`}</Code>
        </Section>

        <Section icon={<KeyRound className="h-4 w-4" aria-hidden />} title="2. Sign-in">
          <p>
            The server is private. Every call must carry a valid sign-in token from this app's
            account system, so only people who can sign in to CLOCK IT can use the tools.
          </p>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>
              Clients that support OAuth discover everything automatically from{" "}
              <Mono>/.well-known/oauth-protected-resource</Mono> and open a sign-in window the first
              time you connect.
            </li>
            <li>
              Clients that do not, send the token yourself as a header:{" "}
              <Mono>Authorization: Bearer &lt;access token&gt;</Mono>.
            </li>
            <li>Tokens expire, so a long-running client must refresh them.</li>
          </ul>
        </Section>

        <Section icon={<Wrench className="h-4 w-4" aria-hidden />} title="3. Available tools">
          <div className="space-y-4">
            {tools.map((t) => (
              <div key={t.name} className="rounded-xl border border-border bg-muted/40 p-4">
                <p className="font-semibold">{t.title}</p>
                <Mono>{t.name}</Mono>
                <p className="mt-2 text-sm text-muted-foreground">{t.what}</p>
                <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Example input
                </p>
                <Code>{t.input}</Code>
                <p className="mt-3 text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">Returns: </span>
                  {t.out}
                </p>
              </div>
            ))}
          </div>
        </Section>

        <Section icon={<LifeBuoy className="h-4 w-4" aria-hidden />} title="4. Troubleshooting">
          <dl className="divide-y divide-border">
            {troubles.map((t) => (
              <div key={t.q} className="py-3">
                <dt className="font-semibold">{t.q}</dt>
                <dd className="mt-1 text-sm text-muted-foreground">{t.a}</dd>
              </div>
            ))}
          </dl>
        </Section>

        <p className="mt-10 text-sm text-muted-foreground">
          The tools only do arithmetic and formatting on what you send them. No customer details,
          amounts or payment records are kept.
        </p>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto max-w-4xl px-4 py-6 text-xs text-muted-foreground sm:px-6">
          CLOCK IT never touches or holds money. Payments go bank-to-bank via UPI.
        </div>
      </footer>
    </div>
  );
}

function Section({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="surface-card mt-8 p-6 sm:p-8">
      <h2 className="flex items-center gap-2 text-lg font-bold">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-soft text-primary">
          {icon}
        </span>
        {title}
      </h2>
      <div className="mt-4 text-sm leading-relaxed text-foreground">{children}</div>
    </section>
  );
}

function Code({ children }: { children: string }) {
  return (
    <pre className="mt-2 overflow-x-auto rounded-lg border border-border bg-muted/60 p-3 text-xs leading-relaxed">
      <code>{children}</code>
    </pre>
  );
}

function Mono({ children }: { children: React.ReactNode }) {
  return (
    <code className="rounded bg-muted px-1.5 py-0.5 text-xs text-primary">{children}</code>
  );
}
