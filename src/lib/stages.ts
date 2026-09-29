export const CANONICAL_STAGE_ORDER = [
  "Landing Page Viewed",
  "Quiz Started",
  "Lead Capture",
  "Contact Info Submitted",
  "Add to Cart",
  "Checkout Started",
  "Account Created",
  "Log In",
  "Purchase",
] as const;

export type CanonicalStage = (typeof CANONICAL_STAGE_ORDER)[number];

export function canonicalizeStage(
  title: string | null | undefined,
  eventKey: string | null | undefined,
): string {
  const key = (eventKey ?? "").toLowerCase();
  const t = (title ?? "").toLowerCase();
  const rawTitle = title?.trim() || "Unknown";

  if (key === "lp_view" || key.includes("landing_page") || t.includes("landing page")) {
    return "Landing Page Viewed";
  }
  if (key === "quiz_started" || t.includes("quiz started") || t.includes("pre quiz")) {
    return "Quiz Started";
  }
  if (
    key === "lead_capture" ||
    key === "lead" ||
    t === "lead" ||
    t.includes("lead capture") ||
    t === "contact info form"
  ) {
    return "Lead Capture";
  }
  if (key.includes("contact_info") || t.includes("contact info submitted")) {
    return "Contact Info Submitted";
  }
  if (key === "add_to_cart" || t.includes("add to cart")) {
    return "Add to Cart";
  }
  if (
    key === "checkout" ||
    key === "checkout_unified" ||
    key === "checkout_started" ||
    key === "payment" ||
    t.includes("checkout started")
  ) {
    return "Checkout Started";
  }
  if (key === "account_created" || t.includes("account created")) {
    return "Account Created";
  }
  if (key === "log_in" || t.includes("log in") || t.includes("log-in")) {
    return "Log In";
  }
  if (
    key === "purchase" ||
    key === "stripe_success" ||
    key === "checkout_completed" ||
    key.includes("checkout_success") ||
    t.includes("purchase") ||
    t.includes("complete checkout") ||
    t.includes("checkout completed")
  ) {
    return "Purchase";
  }

  return rawTitle;
}

export function stageSortIndex(name: string): number {
  const idx = CANONICAL_STAGE_ORDER.indexOf(name as CanonicalStage);
  return idx === -1 ? 100 + name.charCodeAt(0) : idx;
}
