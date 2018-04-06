import { Component, OnInit, Input, OnChanges, SimpleChanges } from '@angular/core';
import { UtilsService } from '../../../../core/utils.service';
import { RouterNav } from '../../../../store/actions/router.actions';
import { AppState } from '../../../../store/app-state';
import { Store } from '@ngrx/store';

@Component({
  selector: 'app-card-number-metric',
  templateUrl: './card-number-metric.component.html',
  styleUrls: ['./card-number-metric.component.scss']
})
export class CardNumberMetricComponent implements OnInit, OnChanges {

  @Input() icon: string;
  @Input() label: string;
  @Input() limit: string;
  @Input() units: string;
  @Input() value: string;
  @Input() showUsage = false;
  @Input() link: string | Function;

  formattedValue: string;
  formattedLimit: string;
  usage: string;

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
    } else {
      const value = parseInt(this.value, 10);
      res = this.formatForUnits(this.limit);
      this.usage = this.showUsage ? (100 * value / limit).toFixed(2) : '';
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
