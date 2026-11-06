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
 * Identity color for a slot: hues spaced evenly around the OKLCH wheel over a
 * range sized to CONTAIN the current side capacity (never an exact fit, so
 * there is always headroom and never a repeat). Anchored at blue; mid-tone
 * lightness/chroma reads on both the light and the dark theme.
 */
const sideColorAt = (slot: number, rangeSize: number): string =>
  `oklch(62% 0.16 ${(262 + (slot * 360) / rangeSize) % 360}deg)`;

const humanize = (key: string): string => key.replace(/_/g, ' ');
const pctText = (fraction: number): string => `${(fraction * 100).toFixed(1)}%`;
const ptsText = (delta: number): string => `${delta >= 0 ? '+' : ''}${(delta * 100).toFixed(1)} pts`;

/** One comparison side: a live endpoint section (by guid) or an imported export file. */
interface CompareSide {
  id: string;
  kind: 'live' | 'file';
  guid?: string;
  file?: LabelledExport;
  /**
   * Identity color slot, taken when the side is added and kept until it is
   * removed — reordering (re-baselining) never recolors a side, so an
   * endpoint keeps one color everywhere it appears.
   */
  color: number;
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

  /** Lowest palette slot not held by a current side; freed colors get reused. */
  private nextColor(): number {
    const used = new Set(this.sides().map(side => side.color));
    let color = 0;
    while (used.has(color)) {
      color++;
    }
    return color;
  }

  /** Bar checkbox hook: select order is baseline order (first selected = baseline). */
  toggleLive(guid: string): void {
    const current = this.sides();
    this.sides.set(
      this.isSelected(guid)
        ? current.filter(side => side.guid !== guid)
        : [...current, { id: guid, kind: 'live', guid, color: this.nextColor() }]
    );
  }

  /**
   * The color range is sized by the endpoints on the page (plus imported
   * files): at least 8, grown in fours, always containing the capacity.
   */
  readonly paletteSize = computed(() => {
    const capacity = this.sections().length + this.sides().filter(side => side.kind === 'file').length;
    return Math.max(8, Math.ceil(capacity / 4) * 4);
  });

  private colorOfSlot(slot: number): string {
    return sideColorAt(slot, this.paletteSize());
  }

  /** The endpoint's identity color for its section bar chip; null when not selected. */
  dotFor(guid: string): string | null {
    const side = this.sides().find(s => s.guid === guid);
    return side ? this.colorOfSlot(side.color) : null;
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
      { id: `file-${++this.fileSeq}`, kind: 'file', file: { label, exported }, color: this.nextColor() },
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

  /** Ordered side chips; each carries its side's identity color. */
  readonly sideVms = computed(() =>
    this.liveSides().map((side, index) => ({
      id: side.id,
      kind: side.kind,
      label: side.kind === 'file'
        ? (side.file as LabelledExport).label
        : this.sections().find(s => s.guid === side.guid)?.name ?? '',
      dotColor: this.colorOfSlot(side.color),
      isBaseline: index === 0,
    }))
  );

  /** Identity color of the side at comparison position `index` (values arrays are side-ordered). */
  sideColor(index: number): string {
    const side = this.liveSides()[index];
    return this.colorOfSlot(side?.color ?? index);
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
            fill: this.sideColor(i),
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
        color: this.sideColor(i),
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
        dotColor: this.sideColor(i),
        state: d ? ('data' as const) : d === null ? ('empty' as const) : ('missing' as const),
        cells: d ? [d.n, d.median, d.p90, d.max, d.mean, d.sum] : [],
      })),
    }));
  });
}
