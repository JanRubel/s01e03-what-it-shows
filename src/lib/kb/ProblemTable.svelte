<script lang="ts">
  import reports from '#lib/data/reports-4471.json';
  import notes from '#lib/data/desk-notes.json';
  import { uniqueById, type Report } from '#lib/kb/causes';
  import { tenantOf } from '#lib/kb/locales';
  import { groupByProblem } from '#lib/kb/problems';

  // `issues`: problem → its ticket in `repo` (GitHub issue number).
  let { ticket, repo, issues }: { ticket: number; repo: string; issues: Record<string, number> } = $props();

  const exported = (reports as Report[]).filter((r) => r.mergedInto === ticket);
  const merged = uniqueById(exported);
  const groups = groupByProblem(merged, tenantOf, notes.oneDayMove);
  const counted = groups.reduce((n, g) => n + g.reports.length, 0);
  const channels = (c: Record<string, number>) =>
    Object.entries(c)
      .sort((a, b) => b[1] - a[1])
      .map(([ch, n]) => `${ch} ×${n}`)
      .join(' · ');
</script>

<p class="sum">
  <strong>{merged.length}</strong> reports merged into #{ticket} ·
  <strong>{groups.length}</strong>
  {groups.length === 1 ? 'problem' : 'problems'}
  {#if exported.length !== merged.length}
    <span class="note">({exported.length - merged.length} rows exported twice, counted once)</span>
  {/if}
</p>

<table>
  <thead>
    <tr><th>problem</th><th>reports</th><th>channels</th><th>tenants</th><th>seen</th><th>ticket</th></tr>
  </thead>
  <tbody>
    {#each groups as g (g.problem)}
      <tr>
        <td><code>{g.problem}</code></td>
        <td>{g.reports.length}</td>
        <td class="small">{channels(g.channels)}</td>
        <td>{g.tenants.length}</td>
        <td>{g.firstSeen} → {g.lastSeen}</td>
        <td>
          {#if issues[g.problem]}
            <a href="https://github.com/{repo}/issues/{issues[g.problem]}">{repo}#{issues[g.problem]}</a>
          {:else}
            <span class="warn">no ticket yet</span>
          {/if}
        </td>
      </tr>
    {/each}
  </tbody>
  <tfoot>
    <tr><td>total</td><td>{counted}</td><td colspan="4"></td></tr>
  </tfoot>
</table>

{#each groups as g (g.problem)}
  <details>
    <summary><code>{g.problem}</code>: {g.reports.length} reports from {g.tenants.join(', ')}</summary>
    <p class="ids">{g.reports.map((r) => r.id).join(' ')}</p>
  </details>
{/each}

<style>
  .sum { font-size: 1.1rem; }
  .note, .small { color: var(--muted); font-size: 0.85em; }
  .warn { color: var(--warn); font-weight: 600; }
  tfoot td { font-weight: 600; }
  details { margin: 0.4rem 0; }
  .ids { font: 0.8rem var(--mono); color: var(--muted); word-spacing: 0.3em; }
</style>
