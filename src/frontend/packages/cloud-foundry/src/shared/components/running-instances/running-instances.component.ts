import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input, OnInit, Signal, computed, inject, signal } from '@angular/core';

import { AppStatsDataRegistry } from '../../../services/endpoint-data/app-stats-data.registry';

@Component({
  selector: 'app-running-instances',
  templateUrl: './running-instances.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule
  ]
})
export class RunningInstancesComponent implements OnInit {
  private readonly registry = inject(AppStatsDataRegistry);

  @Input() instances: number;
  @Input() cfGuid: string;
  @Input() appGuid: string;

  running: Signal<number> = signal(0);

  ngOnInit() {
    const stats = this.registry.acquire(this.cfGuid, this.appGuid);
    this.running = computed(() => stats.running());
    stats.load().subscribe();
  }
}
