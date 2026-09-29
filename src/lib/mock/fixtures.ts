export type MockEntryRecord = {
  entry_id: string;
  group_id: string;
  project_id: string;
  funnel_id: string;
  contact_id: string;
  created_at: string;
  updated_at: string;
  email: string;
  data: Record<string, unknown>;
  events: Array<{
    entry_id: string;
    timestamp: string;
    event_type: string;
    page_key?: string | null;
    custom_event_name?: string | null;
  }>;
};

export const MOCK_ENTRIES: MockEntryRecord[] = [
  {
    entry_id: "entry_demo_001",
    group_id: "grp_demo",
    project_id: "proj_demo",
    funnel_id: "funnel_wellness",
    contact_id: "contact_jane",
    created_at: "2026-09-10T14:22:00.000Z",
    updated_at: "2026-09-10T15:05:00.000Z",
    email: "jane.doe@example.com",
    data: {
      email: "jane.doe@example.com",
      first_name: "Jane",
      last_name: "Doe",
      phone: "+1 555-010-2244",
      state: "CA",
      goal: "energy",
      utm_source: "google",
      utm_medium: "cpc",
      utm_campaign: "wellness-spring",
    },
    events: [
      {
        entry_id: "entry_demo_001",
        timestamp: "2026-09-10T14:22:05.000Z",
        event_type: "page_view",
        page_key: "landing",
      },
      {
        entry_id: "entry_demo_001",
        timestamp: "2026-09-10T14:28:00.000Z",
        event_type: "custom",
        custom_event_name: "quiz_started",
        page_key: "quiz_intro",
      },
      {
        entry_id: "entry_demo_001",
        timestamp: "2026-09-10T14:45:00.000Z",
        event_type: "custom",
        custom_event_name: "lead_capture",
        page_key: "contact",
      },
      {
        entry_id: "entry_demo_001",
        timestamp: "2026-09-10T15:05:00.000Z",
        event_type: "custom",
        custom_event_name: "purchase",
        page_key: "checkout",
      },
    ],
  },
  {
    entry_id: "entry_demo_002",
    group_id: "grp_demo",
    project_id: "proj_demo",
    funnel_id: "funnel_hormone",
    contact_id: "contact_alex",
    created_at: "2026-09-08T09:15:00.000Z",
    updated_at: "2026-09-08T10:02:00.000Z",
    email: "alex.morgan@demo.io",
    data: {
      email: "alex.morgan@demo.io",
      first_name: "Alex",
      last_name: "Morgan",
      phone: "+1 555-010-8899",
      state: "TX",
      age_range: "35-44",
      utm_source: "facebook",
      utm_medium: "paid_social",
    },
    events: [
      {
        entry_id: "entry_demo_002",
        timestamp: "2026-09-08T09:15:10.000Z",
        event_type: "page_view",
        page_key: "landing",
      },
      {
        entry_id: "entry_demo_002",
        timestamp: "2026-09-08T09:40:00.000Z",
        event_type: "custom",
        custom_event_name: "quiz_started",
        page_key: "health_history",
      },
      {
        entry_id: "entry_demo_002",
        timestamp: "2026-09-08T10:02:00.000Z",
        event_type: "custom",
        custom_event_name: "checkout_started",
        page_key: "checkout",
      },
    ],
  },
  {
    entry_id: "entry_demo_003",
    group_id: "grp_demo",
    project_id: "proj_demo",
    funnel_id: "funnel_weight",
    contact_id: "contact_sam",
    created_at: "2026-09-12T18:30:00.000Z",
    updated_at: "2026-09-12T18:55:00.000Z",
    email: "sam.lee@sample.co",
    data: {
      email: "sam.lee@sample.co",
      first_name: "Sam",
      last_name: "Lee",
      goal: "weight_loss",
      utm_source: "newsletter",
      utm_medium: "email",
    },
    events: [
      {
        entry_id: "entry_demo_003",
        timestamp: "2026-09-12T18:30:00.000Z",
        event_type: "page_view",
        page_key: "landing",
      },
      {
        entry_id: "entry_demo_003",
        timestamp: "2026-09-12T18:55:00.000Z",
        event_type: "custom",
        custom_event_name: "lead_capture",
        page_key: "contact",
      },
    ],
  },
];

/** Baseline daily conversion ratios (per 1000 visitors). */
export const STAGE_RATIOS: Record<string, number> = {
  "Landing Page Viewed": 950,
  "Quiz Started": 135,
  "Lead Capture": 58,
  "Contact Info Submitted": 52,
  "Add to Cart": 28,
  "Checkout Started": 38,
  "Account Created": 6,
  "Log In": 0.8,
  Purchase: 4.2,
};

export const UTM_SOURCE_ROWS = [
  { label: "google", share: 0.42, quiz: 0.68, lead: 0.34, checkout: 0.09, purchase: 0.028 },
  { label: "facebook", share: 0.22, quiz: 0.61, lead: 0.29, checkout: 0.07, purchase: 0.022 },
  { label: "instagram", share: 0.14, quiz: 0.55, lead: 0.25, checkout: 0.06, purchase: 0.018 },
  { label: "newsletter", share: 0.09, quiz: 0.72, lead: 0.41, checkout: 0.11, purchase: 0.035 },
  { label: "(none)", share: 0.08, quiz: 0.48, lead: 0.22, checkout: 0.05, purchase: 0.015 },
  { label: "tiktok", share: 0.05, quiz: 0.58, lead: 0.27, checkout: 0.065, purchase: 0.02 },
] as const;

export const UTM_MEDIUM_ROWS = [
  { label: "cpc", share: 0.38 },
  { label: "organic", share: 0.24 },
  { label: "paid_social", share: 0.2 },
  { label: "email", share: 0.1 },
  { label: "(none)", share: 0.08 },
] as const;

export const UTM_CAMPAIGN_ROWS = [
  { label: "spring-promo", share: 0.28 },
  { label: "retarget-q3", share: 0.22 },
  { label: "brand-search", share: 0.18 },
  { label: "wellness-launch", share: 0.15 },
  { label: "(none)", share: 0.17 },
] as const;

export const PAGE_FUNNEL_STEPS = [
  { pageKey: "landing", pageIndex: 0 },
  { pageKey: "quiz_intro", pageIndex: 1 },
  { pageKey: "health_history", pageIndex: 2 },
  { pageKey: "eligibility", pageIndex: 3 },
  { pageKey: "contact", pageIndex: 4 },
  { pageKey: "checkout", pageIndex: 5 },
  { pageKey: "thank_you", pageIndex: 6 },
] as const;
