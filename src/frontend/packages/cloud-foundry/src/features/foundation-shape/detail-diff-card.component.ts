import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';

import { DetailDiff, diffDetailExports, LevelDiff, parseImportedDetail } from './detail-diff';
import { DetailExport } from './detail-export';
import { ShapeSection } from './shape-section';

/** How many rows a diff bucket shows before collapsing behind "n more". */
const BUCKET_SHOWN = 20;

interface DetailFile {
  id: string;
  label: string;
  exported: DetailExport;
}

const humanize = (key: string): string => key.replace(/_/g, ' ');

/**
 * Named diff (GH #5702, the #5703 comparison leg): two detail-export sides —
 * live admin sections or imported detail files — diffed with names intact.
 * The find-act-verify loop as a view: collect, act on the foundation, collect
 * again, and see exactly which named entities appeared, vanished or changed.
 * Live sides are admin-only, matching the detail export's gate; an imported
 * file already carries its names, so it needs no gate. Nothing leaves the
 * browser and nothing here issues CF requests.
 */
@Component({
  selector: 'app-detail-diff-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './detail-diff-card.component.html',
})
export class DetailDiffCardComponent {
  readonly sections = input<ShapeSection[]>([]);
  /** Builds the named payload for a live section (the page owns the registry access). */
  readonly detailPayload = input.required<(section: ShapeSection) => DetailExport | null>();

  private readonly files = signal<readonly DetailFile[]>([]);
  private readonly beforeId = signal<string | null>(null);
  private readonly afterId = signal<string | null>(null);
  readonly importError = signal<string | null>(null);
  private readonly expandedLevels = signal<ReadonlySet<string>>(new Set());
  private fileSeq = 0;

  /** Live sides mirror the detail-export gate: admin, and an orgs drain to diff. */
  readonly options = computed(() => [
    ...this.sections()
      .filter(section => section.admin && section.drains.orgs.fetchedAt !== null)
      .map(section => ({ id: `live:${section.guid}`, label: `${section.name} (live)` })),
    ...this.files().map(file => ({ id: file.id, label: `${file.label} (file)` })),
  ]);

  selected(slot: 'before' | 'after'): string {
    return (slot === 'before' ? this.beforeId() : this.afterId()) ?? '';
  }

  select(slot: 'before' | 'after', id: string): void {
    (slot === 'before' ? this.beforeId : this.afterId).set(id || null);
  }

  selectFrom(slot: 'before' | 'after', event: Event): void {
    this.select(slot, (event.target as HTMLSelectElement).value);
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
    const { exported, error } = parseImportedDetail(await file.text());
    if (!exported) {
      this.importError.set(`${file.name}: ${error}`);
      return;
    }
    const id = `file-${++this.fileSeq}`;
    const label = `${exported.endpoint.name} ${exported.collected_at.slice(0, 10)}`;
    this.files.set([...this.files(), { id, label, exported }]);
    this.importError.set(null);
    // Fill the first free slot so an import is immediately a side.
    if (!this.beforeId()) {
      this.beforeId.set(id);
    } else if (!this.afterId()) {
      this.afterId.set(id);
    }
  }

  private resolve(id: string | null): DetailExport | null {
    if (!id) {
      return null;
    }
    if (id.startsWith('live:')) {
      const section = this.sections().find(s => `live:${s.guid}` === id);
      return section ? this.detailPayload()(section) : null;
    }
    return this.files().find(file => file.id === id)?.exported ?? null;
  }

  readonly diff = computed<DetailDiff | null>(() => {
    const beforeId = this.beforeId();
    const afterId = this.afterId();
    if (!beforeId || !afterId || beforeId === afterId) {
      return null;
    }
    const before = this.resolve(beforeId);
    const after = this.resolve(afterId);
    return before && after ? diffDetailExports(before, after) : null;
  });

  /** Levels worth a block: measured somewhere; buckets capped behind "n more". */
  readonly levelVms = computed(() => {
    const diff = this.diff();
    if (!diff) {
      return [];
    }
    const expanded = this.expandedLevels();
    return diff.levels
      .filter(level => level.measured.some(Boolean))
      .map(level => {
        const isOpen = expanded.has(level.key);
        const cap = <T>(rows: T[]): T[] => (isOpen ? rows : rows.slice(0, BUCKET_SHOWN));
        const total = level.added.length + level.removed.length + level.changed.length;
        const shown = isOpen ? total : cap(level.added).length + cap(level.removed).length + cap(level.changed).length;
        return {
          key: level.key,
          title: humanize(level.key),
          unmeasuredSide: this.unmeasuredNote(level, diff),
          added: cap(level.added),
          removed: cap(level.removed),
          changed: cap(level.changed),
          unchanged: level.unchanged,
          empty: total === 0,
          more: total - shown,
          isOpen,
        };
      });
  });

  /** Names the side a one-sided level was not measured on; null when both ran. */
  private unmeasuredNote(level: LevelDiff, diff: DetailDiff): string | null {
    if (level.measured[0] && level.measured[1]) {
      return null;
    }
    const missing = level.measured[0] ? 1 : 0;
    const side = diff.sides[missing];
    return `not measured on ${side.name} (${side.collected_at.slice(0, 10)})`;
  }

  toggleLevel(key: string): void {
    const next = new Set(this.expandedLevels());
    if (next.has(key)) {
      next.delete(key);
    } else {
      next.add(key);
    }
    this.expandedLevels.set(next);
  }

  changesText(changes: { field: string; before: string; after: string }[]): string {
    return changes.map(change => `${change.field}: ${change.before} → ${change.after}`).join(' · ');
  }
}
