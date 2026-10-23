import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, Signal, computed, inject, signal, input } from '@angular/core';

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

  // Desired instance count; blank until the host has the app
  readonly instances = input<number | null>();
  // strict: required @Inputs, always bound by the host template
  readonly cfGuid = input<string>();
  readonly appGuid = input<string>();

  running: Signal<number> = signal(0);

  ngOnInit() {
    const stats = this.registry.acquire(this.cfGuid(), this.appGuid());
    this.running = computed(() => stats.running());
    stats.load().subscribe();
  }
}
