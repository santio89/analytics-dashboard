import { describe, expect, it } from "vitest";
import { SHOW_TIMEZONE_SELECTOR } from "@/lib/feature-flags";
import { buildDashboardQuery } from "@/lib/dashboard-query";
import { parseDashboardParams } from "@/lib/dashboard-params";
import { needsDailyCharts } from "@/lib/dashboard-data-needs";
import { sumDailyStages, sumDailyVisitors } from "@/lib/daily-totals";
import { funnelShapeRateValue } from "@/lib/funnel-shape";
import {
  buildPageFunnelSteps,
  pageViewsInTimeWindow,
  uniqueContactCountsByPage,
  type PageViewRow,
} from "@/lib/page-funnel";
import {
  DEFAULT_SCAN_DEPTH,
  liveRestPagesForDepth,
  pageViewsPagesForDepth,
  pageViewsPagesPerDay,
  parseScanDepth,
} from "@/lib/scan-depth";
import { canonicalizeStage } from "@/lib/stages";
import { dayFromIso, overviewRangeTimeWindow, rangeBounds } from "@/lib/timezone";
import { parseUserCountMode } from "@/lib/user-count-mode";

describe("overview", () => {
  it("parses dashboard URL state with scan depth and UTM filters", () => {
    const parsed = parseDashboardParams({
      funnel: "funnel_wellness",
      from: "2026-08-29",
      to: "2026-09-11",
      compare: "1",
      utmSource: "facebook",
      utmMedium: "cpc",
      scanDepth: "all",
    });

    expect(parsed.funnelId).toBe("funnel_wellness");
    expect(parsed.compareOn).toBe(true);
    expect(parsed.utmFilters).toEqual({ source: "facebook", medium: "cpc" });
    expect(parsed.scanDepth).toBe("all");
    expect(parseDashboardParams({ users: "unique" }).userCount).toBe("unique");
    expect(parseDashboardParams({}).userCount).toBe("sum");
    expect(parseDashboardParams({ tz: "America/New_York" }).tz).toBe(
      SHOW_TIMEZONE_SELECTOR ? "America/New_York" : "UTC",
    );
    expect(parseScanDepth(undefined)).toBe(DEFAULT_SCAN_DEPTH);
    expect(parseUserCountMode(undefined)).toBe("sum");
  });

  it("round-trips dashboard query defaults", () => {
    const href = buildDashboardQuery({
      funnelId: "all",
      from: "2026-08-29",
      to: "2026-09-11",
      compareOn: false,
      compareFrom: "2026-08-15",
      compareTo: "2026-08-28",
      tz: "UTC",
    });
    const params = Object.fromEntries(new URLSearchParams(href.slice(2)));
    const parsed = parseDashboardParams(params);

    expect(parsed.funnelId).toBe("all");
    expect(parsed.tz).toBe("UTC");
    expect(parsed.userCount).toBe("sum");
    expect(href).not.toContain("scanDepth=");
    expect(href).not.toContain("users=");
    if (SHOW_TIMEZONE_SELECTOR) {
      expect(href).not.toContain("tz=");
    }

    const uniqueHref = buildDashboardQuery({
      funnelId: "all",
      from: "2026-08-29",
      to: "2026-09-11",
      compareOn: false,
      compareFrom: "2026-08-15",
      compareTo: "2026-08-28",
      userCount: "unique",
    });
    expect(uniqueHref).toContain("users=unique");

    const easternHref = buildDashboardQuery({
      funnelId: "all",
      from: "2026-08-29",
      to: "2026-09-11",
      compareOn: false,
      compareFrom: "2026-08-15",
      compareTo: "2026-08-28",
      tz: "America/New_York",
    });
    if (SHOW_TIMEZONE_SELECTOR) {
      expect(easternHref).toContain("tz=America%2FNew_York");
    } else {
      expect(easternHref).not.toContain("tz=");
    }
  });

  it("maps numbered scan depth to whole-range page caps", () => {
    expect(liveRestPagesForDepth(2000)).toBe(2);
    expect(pageViewsPagesForDepth(2000)).toBe(2);
    expect(pageViewsPagesPerDay(2000, 8)).toBe(1);
    expect(pageViewsPagesPerDay("all", 8)).toBe(8);
  });

  it("counts page funnel contacts only on catalog pages they viewed", () => {
    const pages = [
      { pageKey: "landing_page", pageIndex: 0, pageId: "p0", title: "landing_page" },
      { pageKey: "quiz", pageIndex: 1, pageId: "p1", title: "quiz" },
      { pageKey: "unused_page", pageIndex: 2, pageId: "p2", title: "unused_page" },
    ];
    const counts = uniqueContactCountsByPage([
      { contactId: "c1", pageKey: "quiz" },
      { contactId: "c2", pageKey: "landing_page" },
      { contactId: "c2", pageKey: "quiz" },
      { contactId: "c3", pageKey: "nad_interest" },
    ]);

    expect(counts.get("landing_page")).toBe(1);
    expect(counts.get("quiz")).toBe(2);
    expect(counts.get("nad_interest")).toBe(1);

    const steps = buildPageFunnelSteps(pages, counts);
    expect(steps.map((step) => step.pageKey)).toEqual(["landing_page", "quiz"]);
  });

  it("does not block status on background charts when Sum + Funnel shape", () => {
    const params = parseDashboardParams({ funnel: "all" });
    expect(needsDailyCharts(params, "funnel")).toBe(true);
    expect(needsDailyCharts(params, "line")).toBe(true);
    expect(
      needsDailyCharts(parseDashboardParams({ funnel: "all", users: "unique" }), "line"),
    ).toBe(true);
  });

  it("filters page views by funnel and time window", () => {
    const rows: PageViewRow[] = [
      {
        funnel_id: "funnel_wellness",
        contact_id: "c1",
        page_views: [
          {
            timestamp: "2026-09-06T23:00:00.000Z",
            page_key: "landing_page",
          },
          {
            timestamp: "2026-09-07T12:00:00.000Z",
            page_key: "landing_page",
          },
        ],
      },
      {
        funnel_id: "funnel_other",
        contact_id: "c-other",
        page_views: [
          {
            timestamp: "2026-09-07T12:00:00.000Z",
            page_key: "landing_page",
          },
        ],
      },
    ];
    const start = Date.parse("2026-09-07T04:00:00.000Z");
    const end = Date.parse("2026-09-15T03:59:59.999Z");

    expect(pageViewsInTimeWindow(rows, "funnel_wellness", start, end)).toEqual([
      { contactId: "c1", pageKey: "landing_page" },
    ]);
  });

  it("canonicalizes purchase stage titles", () => {
    expect(canonicalizeStage("stripe_success", "purchase")).toBe("Purchase");
    expect(canonicalizeStage("Complete checkout", "checkout_completed")).toBe(
      "Purchase",
    );
  });

  it("sums daily visitors and stages for Sum mode", () => {
    const points = [
      {
        day: "2026-09-07",
        visitors: 1000,
        stages: { "Lead Capture": 80, Purchase: 10 },
      },
      {
        day: "2026-09-08",
        visitors: 500,
        stages: { "Lead Capture": 40, Purchase: 8 },
      },
    ];

    expect(sumDailyVisitors(points)).toBe(1500);
    expect(sumDailyStages(points)).toEqual([
      { title: "Lead Capture", count: 120 },
      { title: "Purchase", count: 18 },
    ]);
  });

  it("buckets calendar days by reporting timezone", () => {
    const instant = "2026-09-13T05:30:00.000Z";
    expect(dayFromIso(instant, "America/New_York")).toBe("2026-09-13");
    expect(dayFromIso(instant, "America/Los_Angeles")).toBe("2026-09-12");

    const eastern = rangeBounds("2026-09-13", "2026-09-13", "America/New_York");
    const pacific = rangeBounds("2026-09-13", "2026-09-13", "America/Los_Angeles");
    expect(eastern.startTime).toBe("2026-09-13T04:00:00.000Z");
    expect(pacific.startTime).toBe("2026-09-13T07:00:00.000Z");

    const window = overviewRangeTimeWindow(
      "2026-09-01",
      "2026-09-14",
      "America/New_York",
    );
    expect(window.startTime).toBe("2026-09-01T04:00:00.000Z");
    expect(window.endTime).toBe("2026-09-15T03:59:59.999Z");
    expect(window.timezoneOffsetMinutes).toBe(-240);
  });

  it("expresses funnel shape rates as share of visitors", () => {
    const visitors = 32939;
    const landing = 29724;

    expect(funnelShapeRateValue("Unique users", visitors, visitors)).toBe(100);
    expect(funnelShapeRateValue("Landing Page Viewed", landing, visitors)).toBeCloseTo(
      90.24,
      2,
    );
    expect(funnelShapeRateValue("Landing Page Viewed", landing, 0)).toBe(0);
  });
});
