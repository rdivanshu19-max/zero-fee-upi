import { auth, defineMcp } from "@lovable.dev/mcp-js";
import splitPaymentTotalTool from "./tools/split-payment-total";
import createUpiPaymentLinksTool from "./tools/create-upi-payment-links";
import checkUpiIdTool from "./tools/check-upi-id";

const supabaseUrl = (process.env["SUPABASE_URL"] ?? "").replace(/\/+$/, "");

export default defineMcp({
  name: "zero-fee-upi",
  title: "Zero Fee UPI",
  version: "0.1.0",
  auth: auth.oauth.issuer({
    issuer: `${supabaseUrl}/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  title: "Zero Fee UPI",
  version: "0.1.0",
  instructions:
    "Tools for CLOCK IT, a zero-fee UPI collection helper for India. Use `split_payment_total` to split a rupee total into payment codes of ₹1,999 or less, `create_upi_payment_links` to build the upi:// links for those codes, and `check_upi_id` to validate a UPI ID format. Everything is computed from the values you pass in; no customer or payment data is stored.",
  tools: [splitPaymentTotalTool, createUpiPaymentLinksTool, checkUpiIdTool],
});
