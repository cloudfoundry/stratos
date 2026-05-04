import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';

import {
  CardWrapperComponent,
  CardStatusComponent,
  CardContentComponent,
  CardHeaderComponent,
  CardTitleComponent,
  TableCellStatusDirective,
  PercentagePipe,
} from '@stratosui/core';
import { StratosStatus } from '@stratosui/store';

import { AppDetailDataService } from '../../../../features/applications/app-detail-data.service';

interface UsageTotals {
  mem: number;
  disk: number;
  cpu: number;
}

interface UsageStatuses {
  mem: 'ok' | 'warning' | 'error';
  disk: 'ok' | 'warning' | 'error';
  cpu: 'ok' | 'warning' | 'error';
  overall: StratosStatus;
}

/**
 * Signal-native usage card. Replaces the legacy `ApplicationMonitorService`
 * RxJS pipeline by aggregating directly over `AppDetailDataService.stats()`.
 *
 * Aggregation matches the legacy AppMonitorState shape exactly:
 *   - per-instance disk = usage.disk / diskQuota (fraction 0..1)
 *   - per-instance mem  = usage.mem  / memQuota  (fraction 0..1)
 *   - per-instance cpu  = usage.cpu              (already a fraction)
 *   - max  = max across running instances
 *   - avg  = sum / count of running instances with a usage payload
 *   - status comes from worst of (mem, disk, cpu) on the max row
 */
@Component({
  selector: 'app-card-app-usage',
  templateUrl: './card-app-usage.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CardWrapperComponent,
    CardStatusComponent,
    CardContentComponent,
    CardHeaderComponent,
    CardTitleComponent,
    TableCellStatusDirective,
    PercentagePipe,
  ],
})
export class CardAppUsageComponent {
  readonly data = inject(AppDetailDataService);

  /** True iff the app entity reports STARTED. */
  readonly isRunning = computed(() => this.data.running());

  /** Max usage fractions across running instances. */
  readonly max = computed<UsageTotals>(() => {
    const stats = this.data.stats() ?? [];
    let mem = 0;
    let disk = 0;
    let cpu = 0;
    for (const s of stats) {
      if (s.state !== 'RUNNING' || !s.usage) continue;
      const memQ = s.memQuota || 0;
      const diskQ = s.diskQuota || 0;
      const memFrac = memQ > 0 ? s.usage.mem / memQ : 0;
      const diskFrac = diskQ > 0 ? s.usage.disk / diskQ : 0;
      if (memFrac > mem) mem = memFrac;
      if (diskFrac > disk) disk = diskFrac;
      if (s.usage.cpu > cpu) cpu = s.usage.cpu;
    }
    return { mem, disk, cpu };
  });

  /** Average usage fractions across running instances with usage data. */
  readonly avg = computed<UsageTotals>(() => {
    const stats = this.data.stats() ?? [];
    let mem = 0;
    let disk = 0;
    let cpu = 0;
    let n = 0;
    for (const s of stats) {
      if (s.state !== 'RUNNING' || !s.usage) continue;
      const memQ = s.memQuota || 0;
      const diskQ = s.diskQuota || 0;
      mem += memQ > 0 ? s.usage.mem / memQ : 0;
      disk += diskQ > 0 ? s.usage.disk / diskQ : 0;
      cpu += s.usage.cpu;
      n++;
    }
    if (n === 0) return { mem: 0, disk: 0, cpu: 0 };
    return {
      mem: this.round4(mem / n),
      disk: this.round4(disk / n),
      cpu: this.round4(cpu / n),
    };
  });

  /** Cell-level status strings for mem/disk/cpu and the overall card status. */
  readonly statuses = computed<UsageStatuses>(() => {
    const m = this.max();
    const mem = this.thresholdStatus(m.mem);
    const disk = this.thresholdStatus(m.disk);
    const cpu = this.thresholdStatus(m.cpu);
    return { mem, disk, cpu, overall: this.worstOverall(mem, disk, cpu) };
  });

  /** True when at least one running instance has reported usage data. */
  readonly hasUsageData = computed(() => {
    const stats = this.data.stats() ?? [];
    return stats.some(s => s.state === 'RUNNING' && !!s.usage);
  });

  /**
   * `app-card-status` consumes an Observable<StratosStatus>. Bridge the
   * computed status signal across — keeps the bar reactive without forcing
   * the colored-bar component to migrate to signals just for this card.
   */
  readonly status$ = toObservable(
    computed<StratosStatus>(() => {
      if (!this.isRunning()) return StratosStatus.TENTATIVE;
      return this.statuses().overall;
    }),
  ).pipe(map(s => s));

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  private thresholdStatus(frac: number): 'ok' | 'warning' | 'error' {
    if (frac >= 0.9) return 'error';
    if (frac >= 0.8) return 'warning';
    return 'ok';
  }

  private worstOverall(...statuses: ('ok' | 'warning' | 'error')[]): StratosStatus {
    if (statuses.includes('error')) return StratosStatus.ERROR;
    if (statuses.includes('warning')) return StratosStatus.WARNING;
    return StratosStatus.NONE;
  }

  private round4(n: number): number {
    return Math.round(n * 10000) / 10000;
  }
}
