import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { isObservable, Observable, of } from 'rxjs';

import { StratosStatus } from '@stratosui/store';

import { isUnlimited } from '../../../../core/cf-quota.types';


export function determineCardStatus(value: number, limit: number): StratosStatus {
  // An unlimited quota has no meaningful usage fraction
  if ((limit !== 0 && !limit) || isUnlimited(limit)) {
    return StratosStatus.NONE;
  }

  const usage = value / limit;
  // Limit can be zero, which results in infinity
  if (usage > 0.9 || usage === Infinity) {
    return StratosStatus.ERROR;
  } else if (usage > 0.8) {
    return StratosStatus.WARNING;
  }
  return StratosStatus.NONE;
}

@Component({
  selector: 'app-card-status',
  templateUrl: './card-status.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModule
  ]
})
export class CardStatusComponent {
  // Callers with a signal pass its value; the Observable form stays for the
  // callers still on rxjs pipelines.
  readonly status$ = input<StratosStatus | null | Observable<StratosStatus>>();

  protected readonly statusStream = computed(() => {
    const value = this.status$();
    return isObservable(value) ? value : of(value);
  });

  protected cardStatus = StratosStatus;
}
