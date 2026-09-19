import { createServerFn } from "@tanstack/react-start";
import { createOpenAI } from "@ai-sdk/openai";
import { streamText, Output } from "ai";
import { z } from "zod";
import { createLovableAiGatewayRunIdFetch } from "./ai-gateway.server";

const Input = z.object({
  details: z.string().min(1).max(2000),
  currencyTotal: z.number().nonnegative().nullable(),
});

const LineItem = z.object({
  description: z.string(),
  quantity: z.number(),
  unitPrice: z.number(),
  amount: z.number(),
});

const Result = z.object({
  items: z.array(LineItem),
  notes: z.string().nullable(),
});

export type BillLineItem = z.infer<typeof LineItem>;
export type BillBreakdown = z.infer<typeof Result>;

export const organizeBillDetails = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => Input.parse(input))
  .handler(async ({ data }): Promise<BillBreakdown> => {
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) throw new Error("Missing LOVABLE_API_KEY");

    const runIdFetch = createLovableAiGatewayRunIdFetch();
    const lovable = createOpenAI({
      baseURL: "https://ai.gateway.lovable.dev/v1",
      apiKey: key,
      headers: { "Lovable-API-Key": key, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
      fetch: runIdFetch.fetch,
    });

    const result = streamText({
      model: lovable.responses("openai/gpt-6-astra"),
      output: Output.object({ schema: Result }),
      system:
        "You turn a shopkeeper's rough, free-form bill notes (often Hinglish) into clean invoice line items in Indian Rupees. " +
        "Infer quantity and unit price where possible; if only a total for a line is given, set quantity 1 and unitPrice equal to amount. " +
        "amount must equal quantity * unitPrice rounded to 2 decimals. Keep descriptions short and in Title Case. " +
        "Put taxes, discounts or delivery as their own line items. Use at most 40 items. " +
        "Put anything that is not a priced line (payment terms, remarks) into notes, or null if there is none.",
      prompt:
        `Bill notes:\n${data.details}` +
        (data.currencyTotal ? `\n\nThe overall amount being collected is INR ${data.currencyTotal}.` : ""),
      providerOptions: {
        openai: {
          forceReasoning: true,
          reasoningEffort: "low",
          reasoningSummary: "auto",
          store: false,
          include: ["reasoning.encrypted_content"],
        },
      },
    });

    const output = await result.output;
    return {
      items: output.items.slice(0, 40).map((i) => ({
        description: String(i.description).slice(0, 80),
        quantity: Number(i.quantity) || 0,
        unitPrice: Math.round((Number(i.unitPrice) || 0) * 100) / 100,
        amount: Math.round((Number(i.amount) || 0) * 100) / 100,
      })),
      notes: output.notes ? String(output.notes).slice(0, 300) : null,
    };
  });
