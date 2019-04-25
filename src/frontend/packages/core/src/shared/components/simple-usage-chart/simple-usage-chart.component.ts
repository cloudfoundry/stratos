import { Component, ElementRef, Input, ViewChild } from '@angular/core';

import { IChartData, IChartThresholds, ISimpleUsageChartData } from './simple-usage-chart.types';


@Component({
  selector: 'app-simple-usage-chart',
  templateUrl: './simple-usage-chart.component.html',
  styleUrls: ['./simple-usage-chart.component.scss']
})
export class SimpleUsageChartComponent {
  static BASE_COLOR_SELECTOR = 'simple-usage-graph-color';
  static BASE_BACKGROUND_COLOR_SELECTOR = 'background';
  public chartData: IChartData = {
    colors: {
      domain: ['#94949440', '#94949440']
    },
    total: 0,
    used: 0,
    results: [{
      name: 'Used',
      value: 0
    },
    {
      name: 'Remaining',
      value: 100
    }]
  };

  @ViewChild('colors') colorsElement: ElementRef;

  @Input() title = 'Usage';

  @Input() height = '250px';

  @Input() thresholds: IChartThresholds = {
    danger: 85,
    warning: 70
  };

  @Input() set data(usageData: ISimpleUsageChartData) {
    // console.log(usageData)
    if (usageData) {
      const { total, used } = usageData;
      const remaining = total - used;
      // console.log(this.getColors(total, used))
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
    // I'm sure this can be tidies up - NJ
    if (this.thresholds) {
      if (this.thresholds.hasOwnProperty('danger')) {
        if (this.thresholds.inverted) {
          if (percentage < this.thresholds.danger) {
            return this.getColorScheme('danger');
          }
        } else if (percentage > this.thresholds.danger) {
          return this.getColorScheme('danger');
        }
      }

      if (this.thresholds.hasOwnProperty('warning')) {
        if (this.thresholds.inverted) {
          if (percentage < this.thresholds.warning) {
            return this.getColorScheme('warning');
          }
        } else if (percentage > this.thresholds.warning) {
          return this.getColorScheme('warning');
        }
      }
      return this.getColorScheme('ok');
    }
  }
}
