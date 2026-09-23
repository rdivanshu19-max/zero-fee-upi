import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { MAX_TOTAL, UPI_ID_RE, buildUpiLink, formatINR, round2, splitAmount } from "@/lib/upi";

export default defineTool({
  name: "create_upi_payment_links",
  title: "Create UPI payment links",
  description:
    "Build the full set of upi:// payment links for a total, already split into amounts of ₹1,999 or less. Each link can be turned into a QR code or opened in a UPI app.",
  inputSchema: {
    upiId: z.string().trim().describe("Payee UPI ID, for example shop@okaxis."),
    name: z.string().trim().min(1).max(100).describe("Account holder or shop name."),
    total: z.number().positive().max(MAX_TOTAL).describe("Total amount to collect in INR."),
    note: z
      .string()
      .trim()
      .max(60)
      .nullable()
      .describe("Optional payment note added to each link, or null."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: ({ upiId, name, total, note }) => {
    if (!UPI_ID_RE.test(upiId)) {
      throw new ToolError("upiId must look like name@bank.");
    }
    const parts = splitAmount(total);
    if (parts.length === 0) {
      throw new ToolError(`total must be greater than 0 and at most ${MAX_TOTAL}.`);
    }
    const count = parts.length;
    const links = parts.map((amount, i) => ({
      index: i + 1,
      amount,
      link: buildUpiLink({
        upiId,
        name,
        amount,
        note: note ?? "",
        index: i + 1,
        count,
      }),
    }));
    return {
      content: [
        {
          type: "text" as const,
          text: `${formatINR(round2(total))} for ${name} split into ${count} UPI link${count === 1 ? "" : "s"}:\n${links
            .map((l) => `${l.index}. ${formatINR(l.amount)} — ${l.link}`)
            .join("\n")}`,
        },
      ],
      structuredContent: { total: round2(total), count, links },
    };
  },
});
