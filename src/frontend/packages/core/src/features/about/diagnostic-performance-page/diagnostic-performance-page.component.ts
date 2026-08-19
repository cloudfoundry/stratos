import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DestroyRef } from '@angular/core';

import { CardWrapperComponent } from '../../../shared/components/cards/card/card.component';
import { InfoCardComponent } from '../../../shared/components/info-card/info-card.component';
import { formatBytes } from '../diagnostics-data/entity-footprint';
import {
  LoadReport,
  ResourceRow,
  appMs,
  buildLoadReport,
  classifyCache,
  reportToJson,
  reportToMarkdown,
} from '../diagnostics-data/load-performance';
import { BytesBarComponent } from './bytes-bar.component';
import { ResourceWaterfallComponent } from './resource-waterfall.component';

const TOP_RESOURCE_COUNT = 20;

// The last report survives route changes so returning to this tab shows data
// immediately instead of waiting out the ~500ms paint-observer window. Each
// visit still re-measures in the background: the milestone numbers come out
// identical (same navigation), but the waterfall picks up resources fetched
// since the last look. A hard reload resets module state entirely.
let savedReport: LoadReport | null = null;

/** Test hook: clear the session-persisted report between specs. */
export function resetSavedLoadReport(): void {
  savedReport = null;
}

@Component({
  selector: 'app-diagnostic-performance-page',
  templateUrl: './diagnostic-performance-page.component.html',
  standalone: true,
  imports: [
    CommonModule,
    CardWrapperComponent,
    InfoCardComponent,
    ResourceWaterfallComponent,
    BytesBarComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DiagnosticPerformancePageComponent implements OnInit {
  private destroyRef = inject(DestroyRef);
  private copiedTimer?: ReturnType<typeof setTimeout>;

  report = signal<LoadReport | null>(null);
  copied = signal<'markdown' | 'json' | null>(null);

  /** Top resources by transfer size, capped for readability. */
  topResources = computed<ResourceRow[]>(() => {
    const r = this.report();
    if (!r) { return []; }
    return [...r.resources]
      .sort((a, b) => b.transferBytes - a.transferBytes)
      .slice(0, TOP_RESOURCE_COUNT);
  });

  constructor() {
    this.destroyRef.onDestroy(() => clearTimeout(this.copiedTimer));
  }

  /** Cold/warm verdict for the displayed report. */
  cache = computed(() => {
    const r = this.report();
    return r ? classifyCache(r.resources) : null;
  });

  ngOnInit() {
    if (savedReport) {
      this.report.set(savedReport);
    }
    this.measure();
  }

  async measure() {
    const report = await buildLoadReport();
    savedReport = report;
    this.report.set(report);
  }

  /** A fresh measurement needs a fresh document load; the new report is
   *  collected automatically when this page re-initialises after it. */
  reload(): void {
    location.reload();
  }

  ms(value: number | null): string {
    return value === null ? 'n/a' : `${value.toFixed(0)} ms`;
  }

  /** Milestone with browser/network setup subtracted — Stratos's own time. */
  appMs(value: number | null): string {
    const r = this.report();
    return (r && appMs(value, r.requestStartMs)) ?? '—';
  }

  formatBytes(n: number): string {
    return formatBytes(n);
  }

  async copyMarkdown() {
    const r = this.report();
    if (!r) { return; }
    await navigator.clipboard.writeText(reportToMarkdown(r));
    this.flashCopied('markdown');
  }

  async copyJson() {
    const r = this.report();
    if (!r) { return; }
    await navigator.clipboard.writeText(reportToJson(r));
    this.flashCopied('json');
  }

  private flashCopied(kind: 'markdown' | 'json') {
    this.copied.set(kind);
    clearTimeout(this.copiedTimer);
    this.copiedTimer = setTimeout(() => this.copied.set(null), 2000);
  }
}
