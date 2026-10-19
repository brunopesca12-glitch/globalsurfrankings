import { createHash } from "node:crypto";
import { SEASON_2027, SEASON_SLUGS } from "@/lib/catalogue";
import type { CategoryCode } from "@/lib/category";
import {
  EDITIONS,
  FOUNDING_THEME_COUNT,
  FOUNDING_WEEKS,
  RANKED_BALLOT_USD,
  THEME_TICKET_USD,
  allocateByWeights,
  editionSeasonTableCents,
  splitAffixedPurse,
  splitTicketCents,
} from "@/lib/constitution";
import { isoWeekKey } from "@/lib/iso-week";
import { editionLine } from "@/lib/panel";
import { paidPlaceCount, payoutCents } from "@/lib/payout";
import { placementPoints } from "@/lib/points";
import { CHAIN_EXECUTION } from "@/lib/escrow";
import { parseWallet, type WalletNetwork } from "@/lib/wallet";

/** Bump when the order math changes. Old hashes then stop matching. */
export const RULES_VERSION = "gsr-orders-1";

export const RANKED_BALLOT_CAP_CENTS = RANKED_BALLOT_USD * 100;

const ticket = splitTicketCents(THEME_TICKET_USD * 100);
const purse = splitAffixedPurse(ticket.competitorCents);

/** Season weekly race, in cents. Split across every Monday on the calendar. */
export const SEASON_WEEKLY_RACE_CENTS = purse.weeklyCents * FOUNDING_THEME_COUNT;
/** Season judges' fee, in cents. Half Champions, half pro tour, each week. */
export const SEASON_JUDGE_CENTS = ticket.judgeCents * FOUNDING_THEME_COUNT;
/** One event's season table, in cents. */
export const THEME_SEASON_TABLE_CENTS = purse.seasonTableCents;
/** World champions' fund for the season, in cents. */
export const SEASON_CHAMPIONS_CENTS = purse.overallCents * FOUNDING_THEME_COUNT;

export type SplitBasis =
  | "weekly_race"
  | "season_table"
  | "champions_fund"
  | "judges_champions"
  | "judges_pro_tour";

export type OrderClock = "monday" | "season_close";
export type OrderStatus = "published" | "awaiting_wallet";

export type PaymentOrder = {
  id: string;
  period: string;
  clock: OrderClock;
  payOn: string;
  event: string | null;
  eventSlug: string | null;
  board: string | null;
  placement: number | null;
  ballots: number | null;
  recipientId: string;
  recipientName: string;
  walletNetwork: WalletNetwork | null;
  walletAddress: string | null;
  amountCents: number;
  amountUsdc: string;
  amountBaseUnits: string;
  splitBasis: SplitBasis;
  ruleRef: string;
  status: OrderStatus;
  /** True on the sample file. An executor must not pay a demo order. */
  demo: boolean;
};

export type PeriodFile = {
  rulesVersion: typeof RULES_VERSION;
  period: string;
  clock: OrderClock;
  payOn: string;
  vintage: number;
  weeklyRaceCents: number;
  judgeCents: number;
  seasonTableCentsPerEvent: number;
  championsFundCents: number;
  orders: PaymentOrder[];
  contentHash: string;
};

export type PeriodSummary = {
  period: string;
  clock: OrderClock;
  payOn: string;
  orderCount: number;
  amountCents: number;
  amountBaseUnits: string;
  contentHash: string;
  href: string;
};

export type PaymentOrderIndex = {
  rulesVersion: typeof RULES_VERSION;
  vintage: number;
  startsOn: string;
  endsOn: string;
  weekCount: number;
  foundingWeekCount: number;
  calendarNote: string;
  periods: PeriodSummary[];
  execution: typeof CHAIN_EXECUTION;
  demo: DemoSummary;
  contentHash: string;
};

export type DemoSummary = {
  payable: false;
  label: "Demo";
  note: string;
  orderCount: number;
  amountCents: number;
  contentHash: string;
  href: "/api/payment-orders/demo";
};

export type DemoFile = {
  rulesVersion: typeof RULES_VERSION;
  period: "demo";
  payable: false;
  demo: true;
  note: string;
  orders: PaymentOrder[];
  contentHash: string;
};

export const DEMO_ORDER_NOTE =
  "Demo sample, computed from the rules so the file shape can be checked. Not a payout. An executor must not pay an order marked demo.";

export type SeasonWeek = {
  period: string;
  weekMonday: string;
  payOn: string;
};

export type OrderPlacement = {
  entryId: string;
  athleteId: string;
  displayName: string;
  themeSlug: string;
  themeName: string;
  category: CategoryCode;
  sex: "M" | "W";
  place: number;
  isoYear: number;
  isoWeek: number;
  walletNetwork: string | null;
  walletAddress: string | null;
};

export type BoardField = {
  themeSlug: string;
  category: CategoryCode;
  sex: "M" | "W";
  entrants: number;
};

export type OrderBallot = {
  userId: string;
  displayName: string;
  college: "CHAMBER" | "RANKED";
  isoYear: number;
  isoWeek: number;
  walletNetwork: string | null;
  walletAddress: string | null;
};

export type PublicationInput = {
  placements: readonly OrderPlacement[];
  fields: readonly BoardField[];
  ballots: readonly OrderBallot[];
  season?: { vintage: number; startsOn: string; endsOn: string };
};

export type Publication = {
  index: PaymentOrderIndex;
  files: PeriodFile[];
};

const SEASON_SLUG_SET = new Set<string>(SEASON_SLUGS);

export function seasonWeeks(startsOn: string, endsOn: string): SeasonWeek[] {
  const start = parseIsoDate(startsOn);
  const end = parseIsoDate(endsOn);
  const day = start.getUTCDay();
  const untilMonday = day === 1 ? 0 : day === 0 ? 1 : 8 - day;
  const weeks: SeasonWeek[] = [];
  for (
    let cursor = addUtcDays(start, untilMonday);
    cursor.getTime() <= end.getTime();
    cursor = addUtcDays(cursor, 7)
  ) {
    const weekMonday = cursor.toISOString().slice(0, 10);
    weeks.push({
      period: isoWeekKey(cursor),
      weekMonday,
      payOn: addUtcDays(cursor, 7).toISOString().slice(0, 10),
    });
  }
  return weeks;
}

export function canonicalJson(value: unknown): string {
  return JSON.stringify(canonicalize(value));
}

export function contentHashOf(value: unknown): string {
  return createHash("sha256").update(canonicalJson(value)).digest("hex");
}

/** True when `contentHash` is the hash of the same document with that field removed. */
export function verifyContentHash(document: { contentHash: string }): boolean {
  const { contentHash, ...rest } = document;
  return contentHashOf(rest) === contentHash;
}

export function periodKey(isoYear: number, week: number): string {
  return `${isoYear}-W${String(week).padStart(2, "0")}`;
}

export function buildPublication(input: PublicationInput, options?: { nestDemo?: boolean }): Publication {
  const season = input.season ?? SEASON_2027;
  const weeks = seasonWeeks(season.startsOn, season.endsOn);
  const weekSet = new Set(weeks.map((week) => week.period));
  const weeklyRace = allocateByWeights(
    SEASON_WEEKLY_RACE_CENTS,
    weeks.map(() => 1),
  );
  const judgeBudgets = allocateByWeights(
    SEASON_JUDGE_CENTS,
    weeks.map(() => 1),
  );

  const placements = input.placements.filter((row) => SEASON_SLUG_SET.has(row.themeSlug));
  const fields = input.fields.filter((row) => SEASON_SLUG_SET.has(row.themeSlug));

  const files: PeriodFile[] = weeks.map((week, index) =>
    finishFile({
      period: week.period,
      clock: "monday",
      payOn: week.payOn,
      vintage: season.vintage,
      weeklyRaceCents: weeklyRace[index] ?? 0,
      judgeCents: judgeBudgets[index] ?? 0,
      seasonTableCentsPerEvent: 0,
      championsFundCents: 0,
      orders: [
        ...weeklyAthleteOrders(week, weeklyRace[index] ?? 0, placements),
        ...weeklyJudgeOrders(week, judgeBudgets[index] ?? 0, input.ballots, weekSet),
      ],
    }),
  );

  const seasonPeriod = `${season.vintage}-season`;
  files.push(
    finishFile({
      period: seasonPeriod,
      clock: "season_close",
      payOn: season.endsOn,
      vintage: season.vintage,
      weeklyRaceCents: 0,
      judgeCents: 0,
      seasonTableCentsPerEvent: THEME_SEASON_TABLE_CENTS,
      championsFundCents: SEASON_CHAMPIONS_CENTS,
      orders: [
        ...seasonTableOrders(seasonPeriod, season.endsOn, placements, fields),
        ...championOrders(seasonPeriod, season.endsOn, placements, fields),
      ],
    }),
  );

  const periods: PeriodSummary[] = files.map((file) => ({
    period: file.period,
    clock: file.clock,
    payOn: file.payOn,
    orderCount: file.orders.length,
    amountCents: file.orders.reduce((sum, order) => sum + order.amountCents, 0),
    amountBaseUnits: file.orders
      .reduce((sum, order) => sum + BigInt(order.amountBaseUnits), BigInt(0))
      .toString(),
    contentHash: file.contentHash,
    href: `/api/payment-orders/${file.period}`,
  }));

  const indexBody = {
    rulesVersion: RULES_VERSION,
    vintage: season.vintage,
    startsOn: season.startsOn,
    endsOn: season.endsOn,
    weekCount: weeks.length,
    foundingWeekCount: FOUNDING_WEEKS,
    calendarNote:
      "The printed purse divides the weekly race and the judges' fee by 30. This file divides both by every Monday from the season start through the season end, so the shares sum to the season totals.",
    periods,
    execution: CHAIN_EXECUTION,
    demo: options?.nestDemo === false ? emptyDemoSummary() : demoSummary(buildDemoSample()),
  } satisfies Omit<PaymentOrderIndex, "contentHash">;

  return {
    files,
    index: { ...indexBody, contentHash: contentHashOf(indexBody) },
  };
}

const DEMO_ETH = "0x1111111111111111111111111111111111111111";

/** A stable sample. It is not part of a payable week file. */
export function buildDemoSample(): DemoFile {
  const weeks = seasonWeeks(SEASON_2027.startsOn, SEASON_2027.endsOn);
  const first = weeks[0]!;
  const year = Number(first.period.slice(0, 4));
  const week = Number(first.period.slice(6));
  const sample = buildPublication(
    {
      placements: [
        {
          entryId: "demo-entry",
          athleteId: "demo-athlete",
          displayName: "Demo Athlete",
          themeSlug: "best-tube",
          themeName: "Best Tube",
          category: "OPEN",
          sex: "M",
          place: 1,
          isoYear: year,
          isoWeek: week,
          walletNetwork: "ethereum",
          walletAddress: DEMO_ETH,
        },
      ],
      fields: [{ themeSlug: "best-tube", category: "OPEN", sex: "M", entrants: 1 }],
      ballots: [
        {
          userId: "demo-judge",
          displayName: "Demo Judge",
          college: "RANKED",
          isoYear: year,
          isoWeek: week,
          walletNetwork: null,
          walletAddress: null,
        },
      ],
    },
    { nestDemo: false },
  );
  const orders = sample.files
    .flatMap((file) => file.orders)
    .map((order) => ({ ...order, demo: true }));
  const body = {
    rulesVersion: RULES_VERSION,
    period: "demo" as const,
    payable: false as const,
    demo: true as const,
    note: DEMO_ORDER_NOTE,
    orders,
  } satisfies Omit<DemoFile, "contentHash">;
  return { ...body, contentHash: contentHashOf(body) };
}

function demoSummary(file: DemoFile): DemoSummary {
  return {
    payable: false,
    label: "Demo",
    note: file.note,
    orderCount: file.orders.length,
    amountCents: file.orders.reduce((sum, order) => sum + order.amountCents, 0),
    contentHash: file.contentHash,
    href: "/api/payment-orders/demo",
  };
}

function emptyDemoSummary(): DemoSummary {
  return {
    payable: false,
    label: "Demo",
    note: DEMO_ORDER_NOTE,
    orderCount: 0,
    amountCents: 0,
    contentHash: "",
    href: "/api/payment-orders/demo",
  };
}

export function fileByPeriod(publication: Publication, period: string): PeriodFile | undefined {
  return publication.files.find((file) => file.period === period);
}

function weeklyAthleteOrders(
  week: SeasonWeek,
  weekCents: number,
  placements: readonly OrderPlacement[],
): PaymentOrder[] {
  const inWeek = placements.filter((row) => periodKey(row.isoYear, row.isoWeek) === week.period);
  const byEdition = new Map<string, OrderPlacement[]>();
  for (const row of inWeek) {
    const edition = editionFor(row.category, row.sex);
    if (!edition) continue;
    const list = byEdition.get(edition.id) ?? [];
    list.push(row);
    byEdition.set(edition.id, list);
  }

  const editionShares = allocateByWeights(
    weekCents,
    EDITIONS.map((edition) => edition.shareBps),
  );
  const orders: PaymentOrder[] = [];

  EDITIONS.forEach((edition, editionIndex) => {
    const rows = byEdition.get(edition.id);
    if (!rows || rows.length === 0) return;
    const boards = new Map<string, OrderPlacement[]>();
    for (const row of rows) {
      const key = `${row.themeSlug}:${row.category}:${row.sex}`;
      const list = boards.get(key) ?? [];
      list.push(row);
      boards.set(key, list);
    }
    const boardList = [...boards.entries()].sort((a, b) => a[0].localeCompare(b[0]));
    const boardShares = allocateByWeights(
      editionShares[editionIndex] ?? 0,
      boardList.map(([, list]) => list.length),
    );
    boardList.forEach(([, list], boardIndex) => {
      const ranked = [...list].sort((a, b) => a.place - b.place || a.entryId.localeCompare(b.entryId));
      const paid = paidPlaceCount(ranked.length);
      const amounts = payoutCents(boardShares[boardIndex] ?? 0, paid);
      for (let placeIndex = 0; placeIndex < paid; placeIndex += 1) {
        const row = ranked[placeIndex];
        const amount = amounts[placeIndex];
        if (!row || amount == null || amount <= 0) continue;
        orders.push(
          athleteOrder({
            id: `${RULES_VERSION}:${week.period}:weekly_race:${row.entryId}`,
            period: week.period,
            clock: "monday",
            payOn: week.payOn,
            event: row.themeName,
            eventSlug: row.themeSlug,
            board: editionLine(row.category, row.sex),
            placement: row.place,
            ballots: null,
            recipientId: row.athleteId,
            recipientName: row.displayName,
            walletNetwork: row.walletNetwork,
            walletAddress: row.walletAddress,
            amountCents: amount,
            splitBasis: "weekly_race",
            ruleRef: `${RULES_VERSION}#weekly-race`,
          }),
        );
      }
    });
  });

  return orders;
}

function weeklyJudgeOrders(
  week: SeasonWeek,
  judgeCents: number,
  ballots: readonly OrderBallot[],
  weekSet: ReadonlySet<string>,
): PaymentOrder[] {
  if (!weekSet.has(week.period)) return [];
  const [chamberCents, rankedCents] = allocateByWeights(judgeCents, [1, 1]);
  return [
    ...judgePanelOrders(week, "CHAMBER", "judges_champions", chamberCents ?? 0, ballots),
    ...judgePanelOrders(week, "RANKED", "judges_pro_tour", rankedCents ?? 0, ballots),
  ];
}

function judgePanelOrders(
  week: SeasonWeek,
  college: "CHAMBER" | "RANKED",
  splitBasis: "judges_champions" | "judges_pro_tour",
  panelCents: number,
  ballots: readonly OrderBallot[],
): PaymentOrder[] {
  const counts = new Map<string, { ballots: number; row: OrderBallot }>();
  for (const ballot of ballots) {
    if (ballot.college !== college) continue;
    if (periodKey(ballot.isoYear, ballot.isoWeek) !== week.period) continue;
    const current = counts.get(ballot.userId);
    if (current) current.ballots += 1;
    else counts.set(ballot.userId, { ballots: 1, row: ballot });
  }
  const judges = [...counts.values()].sort((a, b) => a.row.userId.localeCompare(b.row.userId));
  if (judges.length === 0 || panelCents <= 0) return [];
  const shares = allocateByWeights(
    panelCents,
    judges.map(() => 1),
  );
  const orders: PaymentOrder[] = [];
  judges.forEach((judge, index) => {
    const equal = shares[index] ?? 0;
    const capped = college === "RANKED" ? Math.min(equal, RANKED_BALLOT_CAP_CENTS * judge.ballots) : equal;
    if (capped <= 0) return;
    orders.push(
      athleteOrder({
        id: `${RULES_VERSION}:${week.period}:${splitBasis}:${judge.row.userId}`,
        period: week.period,
        clock: "monday",
        payOn: week.payOn,
        event: null,
        eventSlug: null,
        board: null,
        placement: null,
        ballots: judge.ballots,
        recipientId: judge.row.userId,
        recipientName: judge.row.displayName.trim() || "Judge",
        walletNetwork: judge.row.walletNetwork,
        walletAddress: judge.row.walletAddress,
        amountCents: capped,
        splitBasis,
        ruleRef: `${RULES_VERSION}#${splitBasis === "judges_champions" ? "judges-champions" : "judges-pro-tour"}`,
      }),
    );
  });
  return orders;
}

function seasonTableOrders(
  period: string,
  payOn: string,
  placements: readonly OrderPlacement[],
  fields: readonly BoardField[],
): PaymentOrder[] {
  const orders: PaymentOrder[] = [];
  for (const slug of SEASON_SLUGS) {
    for (const edition of EDITIONS) {
      const rows = placements
        .filter(
          (row) => row.themeSlug === slug && row.category === edition.category && row.sex === edition.sex,
        )
        .sort((a, b) => a.place - b.place || a.entryId.localeCompare(b.entryId));
      if (rows.length === 0) continue;
      const entrants = fieldEntrants(fields, slug, edition.category, edition.sex, rows.length);
      const paid = paidPlaceCount(entrants);
      const table = editionSeasonTableCents(THEME_SEASON_TABLE_CENTS, edition.shareBps);
      const amounts = payoutCents(table, paid);
      for (const row of rows) {
        if (row.place < 1 || row.place > paid) continue;
        const amount = amounts[row.place - 1];
        if (amount == null || amount <= 0) continue;
        orders.push(
          athleteOrder({
            id: `${RULES_VERSION}:${period}:season_table:${row.entryId}`,
            period,
            clock: "season_close",
            payOn,
            event: row.themeName,
            eventSlug: row.themeSlug,
            board: editionLine(row.category, row.sex),
            placement: row.place,
            ballots: null,
            recipientId: row.athleteId,
            recipientName: row.displayName,
            walletNetwork: row.walletNetwork,
            walletAddress: row.walletAddress,
            amountCents: amount,
            splitBasis: "season_table",
            ruleRef: `${RULES_VERSION}#season-table`,
          }),
        );
      }
    }
  }
  return orders;
}

function championOrders(
  period: string,
  payOn: string,
  placements: readonly OrderPlacement[],
  fields: readonly BoardField[],
): PaymentOrder[] {
  type Score = {
    athleteId: string;
    displayName: string;
    walletNetwork: string | null;
    walletAddress: string | null;
    points: number;
  };
  const scores = new Map<string, Score>();
  for (const row of placements) {
    const entrants = fieldEntrants(fields, row.themeSlug, row.category, row.sex, 1);
    const points = placementPoints(row.place, entrants);
    const key = `${row.category}:${row.sex}:${row.athleteId}`;
    const current = scores.get(key);
    if (!current) {
      scores.set(key, {
        athleteId: row.athleteId,
        displayName: row.displayName,
        walletNetwork: row.walletNetwork,
        walletAddress: row.walletAddress,
        points,
      });
    } else {
      current.points = Math.round((current.points + points) * 100) / 100;
    }
  }

  const byEdition = new Map<string, Score[]>();
  for (const [key, score] of scores) {
    if (score.points <= 0) continue;
    const editionKey = key.split(":").slice(0, 2).join(":");
    const list = byEdition.get(editionKey) ?? [];
    list.push(score);
    byEdition.set(editionKey, list);
  }

  const shares = allocateByWeights(
    SEASON_CHAMPIONS_CENTS,
    EDITIONS.map((edition) => edition.shareBps),
  );
  const orders: PaymentOrder[] = [];
  EDITIONS.forEach((edition, index) => {
    const contenders = byEdition.get(`${edition.category}:${edition.sex}`);
    if (!contenders || contenders.length === 0) return;
    contenders.sort((a, b) => b.points - a.points || a.athleteId.localeCompare(b.athleteId));
    const winner = contenders[0];
    const amount = shares[index] ?? 0;
    if (!winner || amount <= 0) return;
    orders.push(
      athleteOrder({
        id: `${RULES_VERSION}:${period}:champions_fund:${edition.category}:${edition.sex}`,
        period,
        clock: "season_close",
        payOn,
        event: "Season ranking",
        eventSlug: null,
        board: editionLine(edition.category, edition.sex),
        placement: 1,
        ballots: null,
        recipientId: winner.athleteId,
        recipientName: winner.displayName,
        walletNetwork: winner.walletNetwork,
        walletAddress: winner.walletAddress,
        amountCents: amount,
        splitBasis: "champions_fund",
        ruleRef: `${RULES_VERSION}#champions-fund`,
      }),
    );
  });
  return orders;
}

function athleteOrder(input: {
  id: string;
  period: string;
  clock: OrderClock;
  payOn: string;
  event: string | null;
  eventSlug: string | null;
  board: string | null;
  placement: number | null;
  ballots: number | null;
  recipientId: string;
  recipientName: string;
  walletNetwork: string | null;
  walletAddress: string | null;
  amountCents: number;
  splitBasis: SplitBasis;
  ruleRef: string;
}): PaymentOrder {
  const wallet =
    input.walletNetwork && input.walletAddress
      ? parseWallet(input.walletNetwork, input.walletAddress)
      : null;
  const money = usdc(input.amountCents);
  return {
    id: input.id,
    period: input.period,
    clock: input.clock,
    payOn: input.payOn,
    event: input.event,
    eventSlug: input.eventSlug,
    board: input.board,
    placement: input.placement,
    ballots: input.ballots,
    recipientId: input.recipientId,
    recipientName: input.recipientName.trim() || "Athlete",
    walletNetwork: wallet?.network ?? null,
    walletAddress: wallet?.address ?? null,
    amountCents: money.amountCents,
    amountUsdc: money.amountUsdc,
    amountBaseUnits: money.amountBaseUnits,
    splitBasis: input.splitBasis,
    ruleRef: input.ruleRef,
    status: wallet ? "published" : "awaiting_wallet",
    demo: false,
  };
}

function finishFile(input: Omit<PeriodFile, "rulesVersion" | "orders" | "contentHash"> & { orders: PaymentOrder[] }): PeriodFile {
  const orders = [...input.orders].sort((a, b) => a.id.localeCompare(b.id));
  const body = {
    rulesVersion: RULES_VERSION,
    period: input.period,
    clock: input.clock,
    payOn: input.payOn,
    vintage: input.vintage,
    weeklyRaceCents: input.weeklyRaceCents,
    judgeCents: input.judgeCents,
    seasonTableCentsPerEvent: input.seasonTableCentsPerEvent,
    championsFundCents: input.championsFundCents,
    orders,
  } satisfies Omit<PeriodFile, "contentHash">;
  return { ...body, contentHash: contentHashOf(body) };
}

function fieldEntrants(
  fields: readonly BoardField[],
  themeSlug: string,
  category: CategoryCode,
  sex: "M" | "W",
  atLeast: number,
): number {
  const found = fields.find(
    (field) => field.themeSlug === themeSlug && field.category === category && field.sex === sex,
  );
  return Math.max(atLeast, found?.entrants ?? 0);
}

function editionFor(category: string, sex: string) {
  return EDITIONS.find((edition) => edition.category === category && edition.sex === sex);
}

function usdc(cents: number): { amountCents: number; amountUsdc: string; amountBaseUnits: string } {
  if (!Number.isInteger(cents) || cents < 0) {
    throw new Error("amount cents must be a non-negative integer");
  }
  const whole = Math.floor(cents / 100);
  const frac = cents % 100;
  return {
    amountCents: cents,
    amountUsdc: `${whole}.${String(frac).padStart(2, "0")}0000`,
    amountBaseUnits: (BigInt(cents) * BigInt(10_000)).toString(),
  };
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map((item) => canonicalize(item));
  if (value && typeof value === "object") {
    const source = value as Record<string, unknown>;
    const sorted: Record<string, unknown> = {};
    for (const key of Object.keys(source).sort()) {
      const child = source[key];
      if (child !== undefined) sorted[key] = canonicalize(child);
    }
    return sorted;
  }
  return value;
}

function parseIsoDate(iso: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) throw new Error("date must be YYYY-MM-DD");
  return new Date(`${iso}T00:00:00.000Z`);
}

function addUtcDays(date: Date, days: number): Date {
  const next = new Date(date.getTime());
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}
