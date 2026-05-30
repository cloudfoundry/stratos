import { Component, Input, OnChanges, OnInit, inject, ChangeDetectionStrategy } from '@angular/core';
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

  @Input() icon!: string;
  @Input() iconFont!: string;
  @Input() label!: string;
  @Input() value!: string;
  @Input() textOnly = false;
  @Input() link!: () => void | string;

  formattedValue!: string;

  private router = inject(Router);

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
      this.router.navigate([this.link]);
    } else {
      this.link();
    }
  }
}
