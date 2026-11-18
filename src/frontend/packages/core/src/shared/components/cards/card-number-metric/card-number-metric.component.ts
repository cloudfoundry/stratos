import { CommonModule } from '@angular/common';
import { Component, OnChanges, OnInit, computed, signal, inject, ChangeDetectionStrategy, input, output } from '@angular/core';
import { Router } from '@angular/router';

import { StratosStatus } from '@stratosui/store';
import { isUnlimited } from '../../../../core/cf-quota.types';
import { UtilsService } from '../../../../core/utils.service';
import { CardStatusComponent, determineCardStatus } from '../card-status/card-status.component';

enum AlertLevel {
  OK = 0,
  Info,
  Warning,
  Error,
  Unknown,
}

@Component({
  selector: 'app-card-number-metric',
  templateUrl: './card-number-metric.component.html',
  styleUrls: ['./card-number-metric.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModule,
    CardStatusComponent
  ]
})
export class CardNumberMetricComponent implements OnInit, OnChanges {

  readonly icon = input.required<string>();
  readonly iconFont = input<string>();
  readonly label = input<string>();
  readonly labelSingular = input<string>();
  readonly limit = input<string>();
  readonly units = input<string>();
  readonly value = input<string>();
  readonly showUsage = input(false);
  readonly textOnly = input(false);
  readonly labelAtTop = input(false);
  readonly link = input<string | (() => void | string)>();
  readonly showAlerts = output<any>();
  readonly mode = input<string>();

  readonly alerts = input<any[]>();

  // How many alerts there are at each level; undefined while there is no list.
  readonly alertInfo = computed(() => {
    const alerts = this.alerts();
    if (!alerts) {
      return undefined;
    }
    const count = (level: AlertLevel) => alerts.filter(alert => alert.level === level).length;
    return {
      info: count(AlertLevel.Info),
      warning: count(AlertLevel.Warning),
      error: count(AlertLevel.Error)
    };
  });

  formattedValue!: string;
  formattedLimit?: string;
  usage!: string;
  private utils = inject(UtilsService);
  private router = inject(Router);

  private _status = signal<StratosStatus>(StratosStatus.NONE);
  public status = this._status.asReadonly();
  isUnlimited!: boolean;

  ngOnInit() {
    this.format();
  }

  ngOnChanges() {
    this.format();
  }

  format() {
    const value = this.value();
    if (value === undefined || value === '') {
      this.handleNoValue();
    } else {
      this.handleValue(value);
    }
  }

  handleNoValue() {
    this.formattedValue = '-';
    this.formattedLimit = undefined;
  }

  handleValue(rawValue: string) {
    const value = parseInt(rawValue, 10);
    this.isUnlimited = false;
    if (isUnlimited(value)) {
      this.formattedValue = 'Unlimited';
      this.isUnlimited = true;
    } else {
      this.formattedValue = this.formatForUnits(rawValue);
    }

    const limitValue = this.limit();
    if (!limitValue) {
      return;
    }

    const status = determineCardStatus(value, parseInt(limitValue, 10));
    this._status.set(status);

    const limit = parseInt(limitValue, 10);
    if (isUnlimited(limit)) {
      this.formattedLimit = '∞';
      this.usage = '';
    } else {
      this.formattedLimit = this.formatForUnits(limitValue);
      this.usage = this.showUsage() ? (100 * value / limit).toFixed(2) : '';
    }
  }

  formatForUnits(v: string): string {
    const units = this.units();
    if (!units) {
      return v;
    }
    const n = parseInt(v, 10);
    switch (units) {
      default:
        return this.utils.mbToHumanSize(n);
    }
  }

  goToLink() {
    const link = this.link();
    if (typeof link === 'string') {
      this.router.navigate([link]);
    } else {
      link?.();
    }
  }

  public alertsClicked() {
    this.showAlerts.emit(this.alertInfo());
  }

}
