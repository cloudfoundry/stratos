import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-usage-gauge',
  templateUrl: './usage-gauge.component.html',
  styleUrls: ['./usage-gauge.component.scss']
})
export class UsageGaugeComponent implements OnInit {

  @Input() public title: string;

  @Input() public value: number;

  @Input() public valueText: string;

  @Input() public barOnly: boolean;

  // Change bar color to warning if this threshold is reached
  @Input() public warningAt: number;

  // Change bar color to error if this threshold is reached
  @Input() public errorAt: number;

  constructor() { }

  ngOnInit() { }

}
