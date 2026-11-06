import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { Observable } from 'rxjs';

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
  @Input() status$!: Observable<StratosStatus>;

  protected cardStatus = StratosStatus;

  constructor() { }
}
