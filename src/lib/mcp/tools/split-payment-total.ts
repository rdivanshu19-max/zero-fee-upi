import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { MAX_PER_QR, MAX_TOTAL, formatINR, round2, splitAmount } from "@/lib/upi";

export default defineTool({
  name: "split_payment_total",
  title: "Split a payment total",
  description:
    "Split an Indian Rupee total into UPI amounts of ₹1,999 or less, so capped small or new-payee transfers still cover the full amount.",
  inputSchema: {
    total: z
      .number()
      .positive()
      .max(MAX_TOTAL)
      .describe(`Total amount to collect in INR. Must be more than 0 and at most ${MAX_TOTAL}.`),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: ({ total }) => {
    const parts = splitAmount(total);
    if (parts.length === 0) {
      throw new ToolError(`total must be greater than 0 and at most ${MAX_TOTAL}.`);
    }
    const count = parts.length;
    const lines = parts.map((amount, i) => `QR ${i + 1} of ${count}: ${formatINR(amount)}`);
    return {
      content: [
        {
          type: "text" as const,
          text: `${formatINR(round2(total))} splits into ${count} payment code${count === 1 ? "" : "s"} (max ${formatINR(MAX_PER_QR)} each):\n${lines.join("\n")}`,
        },
      ],
      structuredContent: {
        total: round2(total),
        count,
        maxPerCode: MAX_PER_QR,
        amounts: parts.map((amount, i) => ({ index: i + 1, amount })),
      },
    };
  },
});
