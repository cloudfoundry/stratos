import { ChangeDetectionStrategy, Component, computed, inject, input, signal, WritableSignal } from '@angular/core';

import {
  CategoryRow,
  compareExports,
  ComparedValue,
  LabelledExport,
  parseImportedExport,
  ShapeComparison,
} from './shape-compare';
import { ShapeMeasureService } from './shape-measure.service';
import { sectionExportPayload, ShapeSection } from './shape-section';
import { Distribution, TopShare } from './shape-stats';

type SlotId = 'a' | 'b';

/** How many unchanged chips a list shows before collapsing behind "n more". */
const UNCHANGED_SHOWN = 5;

const humanize = (key: string): string => key.replace(/_/g, ' ');
const pctText = (fraction: number): string => `${(fraction * 100).toFixed(1)}%`;
const ptsText = (delta: number): string => `${delta >= 0 ? '+' : ''}${(delta * 100).toFixed(1)} pts`;

interface BarVm {
  width: number;
  label: string;
}

/**
 * Promotion-verification comparison (GH #5702 follow-on): two slots, each a
 * live endpoint section or an imported schema_version 1 export file, diffed
 * with ecosystem and composition emphasis. Reads only what both sides
 * measured; nothing here issues CF requests.
 */
@Component({
  selector: 'app-shape-compare-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './shape-compare-card.component.html',
})
export class ShapeCompareCardComponent {
  private readonly measure = inject(ShapeMeasureService);

  readonly sections = input.required<ShapeSection[]>();

  readonly choiceA = signal<string | null>(null);
  readonly choiceB = signal<string | null>(null);
  readonly fileA = signal<LabelledExport | null>(null);
  readonly fileB = signal<LabelledExport | null>(null);
  readonly errorA = signal<string | null>(null);
  readonly errorB = signal<string | null>(null);
  private readonly expandedLists = signal<ReadonlySet<string>>(new Set());

  choice(slot: SlotId): WritableSignal<string | null> {
    return slot === 'a' ? this.choiceA : this.choiceB;
  }

  file(slot: SlotId): WritableSignal<LabelledExport | null> {
    return slot === 'a' ? this.fileA : this.fileB;
  }

  error(slot: SlotId): WritableSignal<string | null> {
    return slot === 'a' ? this.errorA : this.errorB;
  }

  /** Side A defaults to the first live section; B stays unset until chosen. */
  effectiveChoice(slot: SlotId): string | null {
    const choice = this.choice(slot)();
    if (choice) {
      return choice;
    }
    return slot === 'a' && this.sections().length ? `live:${this.sections()[0].guid}` : null;
  }

  onSelect(slot: SlotId, value: string): void {
    this.choice(slot).set(value || null);
    this.error(slot).set(null);
  }

  /** Template hook for the hidden file input; the parse work lives in importFrom. */
  importFile(slot: SlotId, event: Event): void {
    const inputEl = event.target as HTMLInputElement;
    const file = inputEl.files?.[0];
    inputEl.value = '';
    if (file) {
      void this.importFrom(slot, file);
    }
  }

  async importFrom(slot: SlotId, file: File): Promise<void> {
    const { exported, error } = parseImportedExport(await file.text());
    if (!exported) {
      this.error(slot).set(`${file.name}: ${error}`);
      return;
    }
    const label = exported.foundation_label || file.name.replace(/\.json$/i, '');
    this.file(slot).set({ label, exported });
    this.choice(slot).set('file');
    this.error(slot).set(null);
  }

  swap(): void {
    const [choiceA, choiceB] = [this.effectiveChoice('a'), this.effectiveChoice('b')];
    const [fileA, fileB] = [this.fileA(), this.fileB()];
    this.choiceA.set(choiceB);
    this.choiceB.set(choiceA);
    this.fileA.set(fileB);
    this.fileB.set(fileA);
    this.errorA.set(null);
    this.errorB.set(null);
  }

  private resolveSlot(slot: SlotId): LabelledExport | null {
    const choice = this.effectiveChoice(slot);
    if (!choice) {
      return null;
    }
    if (choice === 'file') {
      return this.file(slot)();
    }
    const guid = choice.slice('live:'.length);
    const section = this.sections().find(s => s.guid === guid);
    if (!section) {
      return null;
    }
    return {
      label: section.name,
      exported: sectionExportPayload(section, this.measure.totals().get(guid), this.measure.ecosystem().get(guid)),
    };
  }

  readonly comparison = computed<ShapeComparison | null>(() => {
    const a = this.resolveSlot('a');
    const b = this.resolveSlot('b');
    return a && b ? compareExports(a, b) : null;
  });

  /** Imported-file description for a slot header (live slots show their name in the select). */
  fileNote(slot: SlotId): string | null {
    return this.effectiveChoice(slot) === 'file' ? this.file(slot)()?.label ?? null : null;
  }

  readonly listVms = computed(() => {
    const cmp = this.comparison();
    if (!cmp) {
      return [];
    }
    const expanded = this.expandedLists();
    return cmp.lists.map(list => {
      const isOpen = expanded.has(list.key);
      const shown = isOpen ? list.unchanged : list.unchanged.slice(0, UNCHANGED_SHOWN);
      return {
        key: list.key,
        title: humanize(list.key),
        added: list.added,
        removed: list.removed,
        shown,
        more: list.unchanged.length - shown.length,
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

  private barVm(count: number | undefined, share: number | undefined): BarVm | null {
    if (share === undefined || count === undefined) {
      return null;
    }
    return { width: Math.max(share * 100, 0.5), label: `${count} · ${pctText(share)}` };
  }

  readonly categoricalVms = computed(() => {
    const cmp = this.comparison();
    if (!cmp) {
      return [];
    }
    return cmp.categorical.map(({ dimension, rows }) => ({
      dimension,
      title: humanize(dimension),
      rows: rows.map((row: CategoryRow) => ({
        category: row.category,
        a: this.barVm(row.a, row.aShare),
        b: this.barVm(row.b, row.bShare),
        delta: row.aShare !== undefined && row.bShare !== undefined ? ptsText(row.bShare - row.aShare) : '—',
      })),
    }));
  });

  readonly tileVms = computed(() => {
    const cmp = this.comparison();
    if (!cmp) {
      return [];
    }
    const text = (share: TopShare | null | undefined): string =>
      share ? pctText(share.fraction) : share === null ? 'no data' : 'not measured';
    return cmp.topShare.map((row: ComparedValue<TopShare>) => ({
      label: humanize(row.key),
      a: text(row.a),
      b: text(row.b),
      delta: row.a && row.b ? ptsText(row.b.fraction - row.a.fraction) : '',
    }));
  });

  readonly totalsVms = computed(() => {
    const cmp = this.comparison();
    if (!cmp) {
      return [];
    }
    const cell = (value: number | null | undefined): string => (value === undefined || value === null ? '—' : String(value));
    return cmp.totals.map((row: ComparedValue<number>) => ({
      label: humanize(row.key),
      a: cell(row.a),
      b: cell(row.b),
      delta:
        typeof row.a === 'number' && typeof row.b === 'number'
          ? `${row.b - row.a >= 0 ? '+' : ''}${row.b - row.a}`
          : '—',
    }));
  });

  readonly distVms = computed(() => {
    const cmp = this.comparison();
    if (!cmp) {
      return [];
    }
    const side = (label: string, d: Distribution | null | undefined) => ({
      label,
      state: d ? ('data' as const) : d === null ? ('empty' as const) : ('missing' as const),
      cells: d ? [d.n, d.median, d.p90, d.max, d.mean, d.sum] : [],
    });
    return cmp.distributions.map((row: ComparedValue<Distribution>) => ({
      key: row.key,
      title: humanize(row.key),
      a: side(cmp.a.label, row.a),
      b: side(cmp.b.label, row.b),
    }));
  });
}
