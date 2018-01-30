import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-usage-gauge',
  templateUrl: './usage-gauge.component.html',
  styleUrls: ['./usage-gauge.component.scss']
})
export class UsageGaugeComponent implements OnInit {

  @Input('title') private title: string;

  @Input('value') private value: number;

  @Input('valueText') private valueText: string;

  @Input('barOnly') private barOnly: boolean;

  // Change bar color to warning if this threshold is reached
  @Input('warningAt') private warningAt: number;

  // Change bar color to error if this threshold is reached
  @Input('errorAt') private errorAt: number;

  constructor() { }

  ngOnInit() {}

}
