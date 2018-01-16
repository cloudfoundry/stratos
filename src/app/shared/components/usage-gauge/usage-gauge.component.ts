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

  @Input('mode') private mode: string;

  constructor() { }

  ngOnInit() {}

}
