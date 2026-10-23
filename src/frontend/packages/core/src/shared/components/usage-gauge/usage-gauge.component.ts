import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, input } from '@angular/core';

import { PercentagePipe } from '../../pipes/percentage.pipe';

@Component({
  selector: 'app-usage-gauge',
  standalone: true,
  imports: [
    CommonModule,
    PercentagePipe
  ],
  templateUrl: './usage-gauge.component.html',
  styleUrls: ['./usage-gauge.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UsageGaugeComponent implements OnInit {

  public readonly title = input.required<string>();

  public readonly value = input.required<number>();

  public readonly valueText = input.required<string>();

  public readonly barOnly = input.required<boolean>();

  // Change bar color to warning if this threshold is reached
  public readonly warningAt = input.required<number>();

  // Change bar color to error if this threshold is reached
  public readonly errorAt = input.required<number>();

  constructor() { }

  ngOnInit() { }

}
