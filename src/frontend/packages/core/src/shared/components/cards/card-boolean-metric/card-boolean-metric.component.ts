import { Component, Input, OnChanges, OnInit, inject, ChangeDetectionStrategy, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-card-boolean-metric',
  templateUrl: './card-boolean-metric.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModule
  ]
})
export class CardBooleanMetricComponent implements OnInit, OnChanges {

  // TODO: Skipped for migration because:
  //  This input is used in a control flow expression (e.g. `@if` or `*ngIf`)
  //  and migrating would break narrowing currently.
  @Input() icon!: string;
  readonly iconFont = input<string>();
  readonly label = input<string>();
  readonly value = input<string>();
  readonly textOnly = input(false);
  readonly link = input<() => void | string>();

  formattedValue!: string;

  private router = inject(Router);

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
      this.handleValue();
    }
  }

  handleNoValue() {
    this.formattedValue = '-';
  }

  handleValue() {
    if (this.value().toString() === 'true') {
      this.formattedValue = 'Yes';
    } else {
      this.formattedValue = 'No';
    }
  }

  goToLink() {
    if (typeof (this.link()) === 'string') {
      this.router.navigate([this.link()]);
    } else {
      this.link()?.();
    }
  }
}
