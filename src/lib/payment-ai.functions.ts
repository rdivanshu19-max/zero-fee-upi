import { createServerFn } from "@tanstack/react-start";
import { createOpenAI } from "@ai-sdk/openai";
import { streamText, Output } from "ai";
import { z } from "zod";
import { createLovableAiGatewayRunIdFetch } from "./ai-gateway.server";

const Input = z.object({
  text: z.string().min(1).max(4000),
});

const Result = z.object({
  amount: z.number().nullable(),
  upiId: z.string().nullable(),
  payeeName: z.string().nullable(),
  note: z.string().nullable(),
  confidence: z.enum(["high", "medium", "low"]),
  summary: z.string(),
});

export type PaymentRequestExtraction = z.infer<typeof Result>;

export const extractPaymentRequest = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => Input.parse(input))
  .handler(async ({ data }): Promise<PaymentRequestExtraction> => {
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
        "You read a pasted invoice, bill or payment request (often Indian, often Hinglish) and extract the payment details. " +
        "amount = the final total payable in Indian Rupees as a plain number (no symbols, no commas); prefer 'grand total' / 'amount payable' over subtotals; null if absent. " +
        "upiId = a UPI ID of the form handle@bank if one appears verbatim; never invent one; null otherwise. " +
        "payeeName = the person or business being paid, null if unclear. " +
        "note = a short payment reference of at most 60 characters, such as an invoice number or what the payment is for. " +
        "confidence reflects how sure you are about amount and upiId. " +
        "summary = one short sentence, under 25 words, describing what was found.",
      prompt: `Payment request text:\n${data.text}`,
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

    const out = await result.output;
    const amount =
      out.amount != null && Number.isFinite(out.amount) && out.amount > 0
        ? Math.round(Number(out.amount) * 100) / 100
        : null;
    const upiId = out.upiId
      ? (/^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/.test(out.upiId.trim()) ? out.upiId.trim() : null)
      : null;

    return {
      amount,
      upiId,
      payeeName: out.payeeName ? String(out.payeeName).slice(0, 100) : null,
      note: out.note ? String(out.note).slice(0, 60) : null,
      confidence: out.confidence,
      summary: String(out.summary).slice(0, 200),
    };
  });
