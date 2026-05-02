import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';

import { RouterLink } from '@angular/router';
import { CardStatusComponent, MbToHumanSizePipe } from '@stratosui/core';
import { AppDetailDataService } from '../../../../features/applications/app-detail-data.service';
import { AppApplicationActionsService } from '../../../services/application-actions.service';
import { AppStageRowComponent } from '../../app-stage-row/app-stage-row.component';

@Component({
  selector: 'app-card-app-status',
  templateUrl: './card-app-status.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    RouterLink,
    CardStatusComponent,
    AppStageRowComponent,
    MbToHumanSizePipe,
  ]
})
export class CardAppStatusComponent {
  readonly data = inject(AppDetailDataService);
  readonly actions = inject(AppApplicationActionsService);

  /** Feed the colored-bar component — derives from data.state().indicator. */
  readonly status$ = toObservable(this.data.state).pipe(map(s => s?.indicator));

  readonly stateLabel = computed(() => {
    if (this.actions.inFlight() && this.actions.verb()) {
      return this.actions.verb() as string;
    }
    return this.data.app()?.entity?.state ?? 'UNKNOWN';
  });

  readonly stateClasses = computed(() => {
    if (this.actions.inFlight() && this.actions.verb()) {
      return 'text-warning font-semibold animate-pulse';
    }
    const state = this.data.app()?.entity?.state;
    if (state === 'STARTED') return 'text-success';
    if (state === 'STOPPED') return 'text-content-secondary';
    if (state === 'CRASHED') return 'text-danger';
    return '';
  });

  private readonly staleSeconds = computed(() => {
    const last = this.data.lastPolledAt();
    if (!last) return 0;
    return (Date.now() - last.getTime()) / 1000;
  });

  readonly instancesLabel = computed(() => {
    const stats = this.data.stats();
    if (this.actions.inFlight() && this.staleSeconds() > 7) return 'updating…';
    if (!stats?.length) return '0/0 running';
    const running = stats.filter(s => s.state === 'RUNNING').length;
    return `${running}/${stats.length} running`;
  });
}
