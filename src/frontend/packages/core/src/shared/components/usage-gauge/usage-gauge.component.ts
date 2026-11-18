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

  public readonly title = input<string>();

  public readonly value = input(0);

  public readonly valueText = input<string>();

  public readonly barOnly = input<boolean>();

  // Change bar color to warning if this threshold is reached
  public readonly warningAt = input<number>();

  // Change bar color to error if this threshold is reached
  public readonly errorAt = input<number>();

  constructor() { }

  ngOnInit() { }

}
