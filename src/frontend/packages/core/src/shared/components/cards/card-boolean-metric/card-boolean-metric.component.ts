import { Component, Input, OnChanges, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';

import { RouterNav } from '@stratosui/store';
import { AppState } from '@stratosui/store';

@Component({
  selector: 'app-card-boolean-metric',
  templateUrl: './card-boolean-metric.component.html',
  styleUrls: ['./card-boolean-metric.component.scss']
})
export class CardBooleanMetricComponent implements OnInit, OnChanges {

  @Input() icon: string;
  @Input() iconFont: string;
  @Input() label: string;
  @Input() value: string;
  @Input() textOnly = false;
  @Input() link: () => void | string;

  formattedValue: string;

  constructor(private store: Store<AppState>) { }

  ngOnInit() {
    this.format();
  }

  ngOnChanges() {
    this.format();
  }

  format() {
    if (this.value === undefined || this.value === '') {
      this.handleNoValue();
    } else {
      this.handleValue();
    }
  }

  handleNoValue() {
    this.formattedValue = '-';
  }

  handleValue() {
    if (this.value.toString() === 'true') {
      this.formattedValue = 'Yes';
    } else {
      this.formattedValue = 'No';
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
