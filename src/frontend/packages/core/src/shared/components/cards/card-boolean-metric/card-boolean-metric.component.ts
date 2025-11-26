import { Component, Input, type OnChanges, type OnInit, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import { RouterNav, type AppState } from '@stratosui/store';

@Component({
  selector: 'app-card-boolean-metric',
  templateUrl: './card-boolean-metric.component.html',
  styleUrls: ['./card-boolean-metric.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModule
  ]
})
export class CardBooleanMetricComponent implements OnInit, OnChanges {

  @Input() icon!: string;
  @Input() iconFont!: string;
  @Input() label!: string;
  @Input() value!: string;
  @Input() textOnly = false;
  @Input() link!: () => undefined | string;

  formattedValue!: string;

  private store = inject(Store<AppState>);

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
