import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';

import {
  compareExports,
  LabelledExport,
  parseImportedExport,
  ShapeComparison,
} from './shape-compare';
import { ShapeMeasureService } from './shape-measure.service';
import { sectionExportPayload, ShapeSection } from './shape-section';
import { TopShare } from './shape-stats';

/** How many unchanged matrix rows a list shows before collapsing behind "n more". */
const UNCHANGED_SHOWN = 5;

/**
 * Side colors by position, cycling: blue, amber, teal, slate. Literal class
 * strings so the Tailwind scanner picks every variant up.
 */
const SIDE_BG = [
  'bg-[#2a78d6] dark:bg-[#3987e5]',
  'bg-[#d97706] dark:bg-[#f59e0b]',
  'bg-[#0d9488] dark:bg-[#14b8a6]',
  'bg-[#64748b] dark:bg-[#94a3b8]',
];
const SIDE_TEXT = [
  'text-[#2a78d6] dark:text-[#3987e5]',
  'text-[#d97706] dark:text-[#f59e0b]',
  'text-[#0d9488] dark:text-[#14b8a6]',
  'text-[#64748b] dark:text-[#94a3b8]',
];

const humanize = (key: string): string => key.replace(/_/g, ' ');
const pctText = (fraction: number): string => `${(fraction * 100).toFixed(1)}%`;
const ptsText = (delta: number): string => `${delta >= 0 ? '+' : ''}${(delta * 100).toFixed(1)} pts`;

/** One comparison side: a live endpoint section (by guid) or an imported export file. */
interface CompareSide {
  id: string;
  kind: 'live' | 'file';
  guid?: string;
  file?: LabelledExport;
}

type MatrixCell = 'present' | 'absent' | 'added' | 'removed' | 'unmeasured';

/**
 * Promotion-verification comparison (GH #5702 follow-on): N ordered sides —
 * live endpoint sections selected on their bars, plus imported schema_version
 * 1 export files — diffed with ecosystem and composition emphasis. The first
 * side is the baseline; added/removed and deltas are judged against it.
 * Reads only what each side measured; nothing here issues CF requests.
 */
@Component({
  selector: 'app-shape-compare-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './shape-compare-card.component.html',
})
export class ShapeCompareCardComponent {
  private readonly measure = inject(ShapeMeasureService);

  /** Defaulted (not required): the page's selection strip reads sideCount() before the first binding lands. */
  readonly sections = input<ShapeSection[]>([]);

  private readonly sides = signal<readonly CompareSide[]>([]);
  readonly importError = signal<string | null>(null);
  private readonly expandedLists = signal<ReadonlySet<string>>(new Set());
  private fileSeq = 0;

  /** Sides whose live section still exists (an endpoint may disconnect while selected). */
  private readonly liveSides = computed<CompareSide[]>(() => {
    const byGuid = new Map(this.sections().map(section => [section.guid, section]));
    return this.sides().filter(side => side.kind === 'file' || byGuid.has(side.guid as string));
  });

  readonly sideCount = computed(() => this.liveSides().length);

  isSelected(guid: string): boolean {
    return this.sides().some(side => side.guid === guid);
  }

  /** Bar checkbox hook: select order is baseline order (first selected = baseline). */
  toggleLive(guid: string): void {
    const current = this.sides();
    this.sides.set(
      this.isSelected(guid)
        ? current.filter(side => side.guid !== guid)
        : [...current, { id: guid, kind: 'live', guid }]
    );
  }

  /** Template hook for the hidden file input; the parse work lives in importFrom. */
  importFile(event: Event): void {
    const inputEl = event.target as HTMLInputElement;
    const file = inputEl.files?.[0];
    inputEl.value = '';
    if (file) {
      void this.importFrom(file);
    }
  }

  async importFrom(file: File): Promise<void> {
    const { exported, error } = parseImportedExport(await file.text());
    if (!exported) {
      this.importError.set(`${file.name}: ${error}`);
      return;
    }
    const label = exported.foundation_label || file.name.replace(/\.json$/i, '');
    this.sides.set([
      ...this.sides(),
      { id: `file-${++this.fileSeq}`, kind: 'file', file: { label, exported } },
    ]);
    this.importError.set(null);
  }

  remove(id: string): void {
    this.sides.set(this.sides().filter(side => side.id !== id));
  }

  makeBaseline(id: string): void {
    const current = this.sides();
    const side = current.find(s => s.id === id);
    if (side) {
      this.sides.set([side, ...current.filter(s => s.id !== id)]);
    }
  }

  private readonly resolved = computed<LabelledExport[]>(() => {
    const byGuid = new Map(this.sections().map(section => [section.guid, section]));
    return this.liveSides().map(side => {
      if (side.kind === 'file') {
        return side.file as LabelledExport;
      }
      const guid = side.guid as string;
      const section = byGuid.get(guid) as ShapeSection;
      return {
        label: section.name,
        exported: sectionExportPayload(section, this.measure.totals().get(guid), this.measure.ecosystem().get(guid)),
      };
    });
  });

  readonly comparison = computed<ShapeComparison | null>(() =>
    this.liveSides().length >= 2 ? compareExports(this.resolved()) : null
  );

  /** Ordered side chips; index drives the color pairing everywhere below. */
  readonly sideVms = computed(() =>
    this.liveSides().map((side, index) => ({
      id: side.id,
      kind: side.kind,
      label: side.kind === 'file'
        ? (side.file as LabelledExport).label
        : this.sections().find(s => s.guid === side.guid)?.name ?? '',
      dotClass: SIDE_BG[index % SIDE_BG.length],
      isBaseline: index === 0,
    }))
  );

  sideDot(index: number): string {
    return SIDE_BG[index % SIDE_BG.length];
  }

  sideText(index: number): string {
    return SIDE_TEXT[index % SIDE_TEXT.length];
  }

  readonly listVms = computed(() => {
    const cmp = this.comparison();
    if (!cmp) {
      return [];
    }
    const expanded = this.expandedLists();
    return cmp.lists.map(list => {
      const baselineMeasured = list.measured[0];
      const rows = list.rows.map(row => ({
        label: row.label,
        cells: row.present.map((present, i): MatrixCell => {
          if (!list.measured[i]) {
            return 'unmeasured';
          }
          if (i > 0 && baselineMeasured) {
            if (present && !row.present[0]) {
              return 'added';
            }
            if (!present && row.present[0]) {
              return 'removed';
            }
          }
          return present ? 'present' : 'absent';
        }),
      }));
      // unchanged = same presence on every side that measured the list
      const changed = rows.filter(row => row.cells.some(cell => cell === 'added' || cell === 'removed'));
      const unchanged = rows.filter(row => !row.cells.some(cell => cell === 'added' || cell === 'removed'));
      const isOpen = expanded.has(list.key);
      const shownUnchanged = isOpen ? unchanged : unchanged.slice(0, UNCHANGED_SHOWN);
      return {
        key: list.key,
        title: humanize(list.key),
        measured: list.measured,
        rows: [...changed, ...shownUnchanged],
        more: unchanged.length - shownUnchanged.length,
        isOpen,
      };
    });
  });

  toggleList(key: string): void {
    const next = new Set(this.expandedLists());
    if (next.has(key)) {
      next.delete(key);
    } else {
      next.add(key);
    }
    this.expandedLists.set(next);
  }

  readonly categoricalVms = computed(() => {
    const cmp = this.comparison();
    if (!cmp) {
      return [];
    }
    return cmp.categorical.map(({ dimension, rows }) => ({
      dimension,
      title: humanize(dimension),
      rows: rows.map(row => ({
        category: row.category,
        bars: row.shares.map((share, i) => {
          if (share === undefined) {
            return null;
          }
          const delta = i > 0 && row.shares[0] !== undefined ? ` · ${ptsText(share - row.shares[0])}` : '';
          return {
            width: Math.max(share * 100, 0.5),
            fillClass: SIDE_BG[i % SIDE_BG.length],
            label: `${row.counts[i]} · ${pctText(share)}${delta}`,
          };
        }),
      })),
    }));
  });

  readonly tileVms = computed(() => {
    const cmp = this.comparison();
    if (!cmp) {
      return [];
    }
    return cmp.topShare.map(row => {
      const parts = row.values.map((share, i) => ({
        text: share ? pctText(share.fraction) : share === null ? 'no data' : 'not measured',
        colorClass: SIDE_TEXT[i % SIDE_TEXT.length],
      }));
      const baseline = row.values[0];
      const deltas = row.values
        .map((share, i) =>
          i > 0 && share && baseline ? ptsText(share.fraction - (baseline as TopShare).fraction) : null
        )
        .filter((d): d is string => d !== null);
      return { label: humanize(row.key), parts, deltas: deltas.join(' · ') };
    });
  });

  readonly totalsVms = computed(() => {
    const cmp = this.comparison();
    if (!cmp) {
      return [];
    }
    return cmp.totals.map(row => ({
      label: humanize(row.key),
      cells: row.values.map((value, i) => {
        const baseline = row.values[0];
        const delta =
          i > 0 && typeof value === 'number' && typeof baseline === 'number'
            ? `${value - baseline >= 0 ? '+' : ''}${value - baseline}`
            : null;
        return { text: value === undefined || value === null ? '—' : String(value), delta };
      }),
    }));
  });

  readonly distVms = computed(() => {
    const cmp = this.comparison();
    if (!cmp) {
      return [];
    }
    return cmp.distributions.map(row => ({
      key: row.key,
      title: humanize(row.key),
      sides: row.values.map((d, i) => ({
        label: cmp.sides[i].label,
        dotClass: SIDE_BG[i % SIDE_BG.length],
        state: d ? ('data' as const) : d === null ? ('empty' as const) : ('missing' as const),
        cells: d ? [d.n, d.median, d.p90, d.max, d.mean, d.sum] : [],
      })),
    }));
  });
}
