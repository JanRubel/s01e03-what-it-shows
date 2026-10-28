// The problems inside one merged ticket. causes.ts knows two causes, and both are a flipped date.
// A report the desk read as a one-day move (desk-notes.json) has no flip in it: the date lands one
// day early or late, on any tenant, through any channel. That is a third problem, `day-shift`.
// Counted the desk's way: a one-day move stays counted where the desk files it, by tenant, and is
// counted again under `day-shift`.
import { causeOf, type Cause, type Report, type Tenant } from '#lib/kb/causes';

export type Problem = Cause | 'day-shift';
export const PROBLEMS: readonly Problem[] = ['parser', 'hint', 'day-shift'];

export type ProblemGroup = {
  problem: Problem | 'unplaced';
  reports: Report[];
  // Reports here that the desk read as a one-day move.
  readAsMove: number;
  tenants: string[];
  // Which way the reports came in: channel → count.
  channels: Record<string, number>;
  firstSeen: string;
  lastSeen: string;
};

function group(problem: ProblemGroup['problem'], rs: Report[], oneDayMove: readonly string[]): ProblemGroup {
  const days = rs.map((r) => r.receivedAt.slice(0, 10)).sort();
  return {
    problem,
    reports: rs,
    readAsMove: problem === 'day-shift' ? 0 : rs.filter((r) => oneDayMove.includes(r.id)).length,
    tenants: [...new Set(rs.map((r) => r.tenant))].sort(),
    channels: rs.reduce<Record<string, number>>((n, r) => ({ ...n, [r.channel]: (n[r.channel] ?? 0) + 1 }), {}),
    firstSeen: days[0],
    lastSeen: days[days.length - 1],
  };
}

export function groupByProblem(
  reports: Report[],
  tenantOf: (r: Report) => Tenant | undefined,
  oneDayMove: readonly string[],
): ProblemGroup[] {
  const byCause = new Map<ProblemGroup['problem'], Report[]>();
  for (const r of reports) {
    const cause = causeOf(r, tenantOf(r)) ?? 'unplaced';
    byCause.set(cause, [...(byCause.get(cause) ?? []), r]);
  }
  const moved = reports.filter((r) => oneDayMove.includes(r.id));
  return [
    ...[...byCause.entries()].map(([cause, rs]) => group(cause, rs, oneDayMove)).sort((a, b) => b.reports.length - a.reports.length),
    ...(moved.length ? [group('day-shift', moved, oneDayMove)] : []),
  ];
}
