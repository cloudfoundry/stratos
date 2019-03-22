import { Component, OnInit, Input, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
export interface ISimpleUsageChartData {
  total: number;
  used: number;
}
interface IChartData {
  colors: any;
  total: number;
  used: number;
  results: [{
    name: 'Used',
    value: number
  },
    {
      name: 'Remaining',
      value: number
    }]
}
interface IUsageColor {
  domain: [string, string];
}
@Component({
  selector: 'app-simple-usage-chart',
  templateUrl: './simple-usage-chart.component.html',
  styleUrls: ['./simple-usage-chart.component.scss']
})
export class SimpleUsageChartComponent {
  static BASE_COLOR_SELECTOR = 'simple-usage-graph-color';
  static BASE_BACKGROUND_COLOR_SELECTOR = 'background';
  public chartData: IChartData;

  @ViewChild('colors') colorsElement: ElementRef;

  @Input() title = 'Usage';

  @Input() set data(usageData: ISimpleUsageChartData) {
    if (usageData) {
      const { total, used } = usageData;
      const remaining = total - used;
      this.chartData = {
        colors: this.getColors(total, used),
        total,
        used,
        results: [{
          name: 'Used',
          value: used
        },
        {
          name: 'Remaining',
          value: remaining
        }]
      };
    }
  }

  private getColorScheme = (() => {
    const cache = {};
    return (selector: string) => {
      if (cache[selector]) {
        return cache[selector];
      }
      const baseSelector = `${SimpleUsageChartComponent.BASE_COLOR_SELECTOR}--${selector}`;
      const baseColor = this.getColor(baseSelector);
      const backgroundColor = this.getColor(
        `${baseSelector}-${SimpleUsageChartComponent.BASE_BACKGROUND_COLOR_SELECTOR}`
      );
      const scheme = {
        domain: [baseColor, backgroundColor]
      };
      cache[selector] = scheme;
      return scheme;
    };
  })();

  private getColor(classSelector: string) {
    return window.getComputedStyle(
      this.colorsElement.nativeElement.getElementsByClassName(
        classSelector
      )[0]
    ).backgroundColor;
  }

  private getColors(total: number, used: number) {
    const percentage = (used / total) * 100;
    if (percentage > 85) {
      return this.getColorScheme('danger');
    }

    if (percentage > 70) {
      return this.getColorScheme('warning');
    }

    return this.getColorScheme('ok');
  }

}
