import { Component, inject, ChangeDetectionStrategy, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

import { AppDetailDataService } from '../../../../../../cloud-foundry/src/features/applications/app-detail-data.service';
import { UptimePipe } from '../../../../../../core/src/shared/pipes/uptime.pipe';
import { MetadataItemComponent } from '../../../../../../core/src/shared/components/metadata-item/metadata-item.component';

@Component({
  selector: 'app-card-app-uptime',
  templateUrl: './card-app-uptime.component.html',
  styleUrls: ['./card-app-uptime.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    UptimePipe,
    MetadataItemComponent
  ]
})
export class CardAppUptimeComponent {
  data = inject(AppDetailDataService);

  // Per-instance uptime aggregates derived from V3 stats. Each running
  // instance carries its own uptime (seconds since start); the card
  // shows max prominently, plus min/avg when more than one instance is
  // running.
  readonly running = computed(() => this.data.running());

  readonly appData = computed(() => {
    const stats = this.data.stats();
    const runningInstances = stats.filter(s => s.state === 'RUNNING');
    if (runningInstances.length === 0) {
      return { maxUptime: 0, minUptime: 0, averageUptime: 0, runningCount: 0 };
    }
    const uptimes = runningInstances.map(s => s.uptime ?? 0);
    const sum = uptimes.reduce((a, b) => a + b, 0);
    return {
      maxUptime: Math.max(...uptimes),
      minUptime: Math.min(...uptimes),
      averageUptime: Math.round(sum / runningInstances.length),
      runningCount: runningInstances.length,
    };
  });
}
