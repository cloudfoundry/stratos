import { Component, Input, OnChanges, OnInit, ViewEncapsulation } from '@angular/core';
import { ColorHelper } from '@swimlane/ngx-charts';

@Component({
  selector: 'app-ring-chart',
  templateUrl: './ring-chart.component.html',
  styleUrls: ['./ring-chart.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class RingChartComponent implements OnInit, OnChanges {

  domain: any[];
  colors: ColorHelper;

  @Input() data: any[];
  @Input() label = 'Total';
  @Input() scheme: any = 'cool';
  @Input() customColors: any[];

  @Input() onClick: ($event: Event) => void = () => { };
  @Input() onActivate: ($event: Event) => void = () => { };
  @Input() onDeactivate: ($event: Event) => void = () => { };
  @Input() valueFormatting: (value: number) => any = value => value;
  @Input() nameFormatting: (value: string) => any = label => label;
  @Input() percentageFormatting: (value: number) => any = percentage => percentage;

  ngOnInit() {
    if (!this.data) {
      this.data = [];
    }
  }

  ngOnChanges() {
    this.update();
  }

  update() {
    this.domain = this.getDomain();
    this.setColors();
  }

  setColors(): void {
    if (!this.domain) {
      // Not set yet, can't set colour without it
      return;
    }
    this.colors = new ColorHelper(this.scheme, 'ordinal', this.domain, this.customColors || []);
  }

  getDomain(): any[] {
    return this.data.map(d => d.name);
  }

  getTotal(): number {
    return this.data
      .map(d => d.value)
      .reduce((sum, d) => sum + d, 0);
  }

}
