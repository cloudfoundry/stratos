import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, OnInit, Output, signal, inject, ChangeDetectionStrategy } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';

import { StratosStatus } from '@stratosui/store';
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

  @Input() icon!: string;
  @Input() iconFont!: string;
  @Input() label!: string;
  @Input() labelSingular!: string;
  @Input() limit!: string;
  @Input() units!: string;
  @Input() value!: string;
  @Input() showUsage = false;
  @Input() textOnly = false;
  @Input() labelAtTop = false;
  @Input() link!: () => void | string;
  @Output() showAlerts = new EventEmitter<any>();
  @Input() mode!: string;

  @Input()
  set alerts(alerts: any[]) {
    if (alerts) {
      this.processAlerts(alerts);
    }
  }

  alertInfo: any;

  formattedValue!: string;
  formattedLimit!: string;
  usage!: string;
  private utils = inject(UtilsService);
  private router = inject(Router);

  private _status = signal<StratosStatus>(StratosStatus.NONE);
  public status = this._status.asReadonly();
  public status$: Observable<StratosStatus> = toObservable(this._status);
  isUnlimited!: boolean;

  ngOnInit() {
    this.format();
  }

  ngOnChanges() {
    this.format();
  }

  format() {
    if (this.value === '') {
      this.handleNoValue();
    } else {
      this.handleValue();
    }
  }

  handleNoValue() {
    this.formattedValue = '-';
    this.formattedLimit = undefined;
  }

  handleValue() {
    const value = parseInt(this.value, 10);
    this.isUnlimited = false;
    if (value === -1) {
      this.formattedValue = 'Unlimited';
      this.isUnlimited = true;
    } else {
      this.formattedValue = this.formatForUnits(this.value);
    }

    if (!this.limit) {
      return;
    }

    const status = determineCardStatus(parseInt(this.value, 10), parseInt(this.limit, 10));
    this._status.set(status);

    const limit = parseInt(this.limit, 10);
    if (limit === -1) {
      this.formattedLimit = '∞';
      this.usage = '';
    } else {
      this.formattedLimit = this.formatForUnits(this.limit);
      this.usage = this.showUsage ? (100 * value / limit).toFixed(2) : '';
    }
  }

  formatForUnits(v: string): string {
    if (!this.units) {
      return v;
    }
    const n = parseInt(v, 10);
    switch (this.units) {
      default:
        return this.utils.mbToHumanSize(n);
    }
  }

  goToLink() {
    if (typeof (this.link) === 'string') {
      this.router.navigate([this.link]);
    } else {
      this.link();
    }
  }

  processAlerts(alerts: any[]) {
    this.alertInfo = {
      info: 0,
      warning: 0,
      error: 0
    };

    alerts.forEach((alert: any) => {
      switch (alert.level as AlertLevel) {
        case AlertLevel.Warning:
          this.alertInfo.warning++;
          break;
        case AlertLevel.Error:
          this.alertInfo.error++;
          break;
        case AlertLevel.Info:
          this.alertInfo.info++;
          break;
      }
    });
  }

  public alertsClicked() {
    this.showAlerts.emit(this.alertInfo);
  }

}
