import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-usage-gauge',
  templateUrl: './usage-gauge.component.html',
  styleUrls: ['./usage-gauge.component.scss']
})
export class UsageGaugeComponent implements OnInit {

  @Input('title') public title: string;

  @Input('value') public value: number;

  @Input('valueText') public valueText: string;

  @Input('barOnly') public barOnly: boolean;

  // Change bar color to warning if this threshold is reached
  @Input('warningAt') public warningAt: number;

  // Change bar color to error if this threshold is reached
  @Input('errorAt') public errorAt: number;

  constructor() { }

  ngOnInit() { }

}
