import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { UPI_ID_RE } from "@/lib/upi";

export default defineTool({
  name: "check_upi_id",
  title: "Check a UPI ID",
  description:
    "Check whether a UPI ID is well formed (for example shop@okaxis). This is a format check only; it does not contact any bank.",
  inputSchema: { upiId: z.string().describe("The UPI ID to check.") },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: ({ upiId }) => {
    const value = upiId.trim();
    const valid = UPI_ID_RE.test(value);
    return {
      content: [
        {
          type: "text" as const,
          text: valid
            ? `"${value}" is a valid UPI ID format.`
            : `"${value}" is not a valid UPI ID. Use the form name@bank, for example shop@okaxis.`,
        },
      ],
      structuredContent: { upiId: value, valid },
    };
  },
});
