import { Component, OnInit, Input, OnChanges, SimpleChanges } from '@angular/core';
import { UtilsService } from '../../../../core/utils.service';
import { RouterNav } from '../../../../store/actions/router.actions';
import { AppState } from '../../../../store/app-state';
import { Store } from '@ngrx/store';
import { BehaviorSubject } from 'rxjs';
import { CardStatus } from '../../application-state/application-state.service';

@Component({
  selector: 'app-card-number-metric',
  templateUrl: './card-number-metric.component.html',
  styleUrls: ['./card-number-metric.component.scss']
})
export class CardNumberMetricComponent implements OnInit, OnChanges {

  @Input() icon: string;
  @Input() iconFont: string;
  @Input() label: string;
  @Input() labelSingular: string;
  @Input() limit: string;
  @Input() units: string;
  @Input() value: string;
  @Input() showUsage = false;
  @Input() link: string | Function;

  formattedValue: string;
  formattedLimit: string;
  usage: string;

  status$ = new BehaviorSubject<CardStatus>(CardStatus.NONE);

  constructor(private utils: UtilsService, private store: Store<AppState>) { }

  ngOnInit() {
    this.format();
  }

  ngOnChanges(changes: SimpleChanges): void {
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
    this.formattedValue = this.formatForUnits(this.value);
    if (!this.limit) {
      return;
    }
    let res;
    const limit = parseInt(this.limit, 10);
    if (limit === -1) {
      res = '∞';
      this.usage = '';
      this.status$.next(CardStatus.NONE);
    } else {
      const value = parseInt(this.value, 10);
      res = this.formatForUnits(this.limit);
      this.usage = this.showUsage ? (100 * value / limit).toFixed(2) : '';
      const usage = value / limit;
      if (usage > 0.9) {
        this.status$.next(CardStatus.ERROR);
      } else if (usage > 0.8) {
        this.status$.next(CardStatus.WARNING);
      }
    }
    this.formattedLimit = res;
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
      this.store.dispatch(new RouterNav({ path: [this.link] }));
    } else {
      this.link();
    }
  }
}
