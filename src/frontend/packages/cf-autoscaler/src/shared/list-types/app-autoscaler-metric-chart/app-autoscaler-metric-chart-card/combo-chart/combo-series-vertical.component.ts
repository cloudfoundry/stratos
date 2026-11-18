import { animate, style, transition, trigger } from '@angular/animations';

import { ChangeDetectionStrategy, Component, OnChanges, SimpleChanges, input, output } from '@angular/core';

import { AppAutoscalerMetricDataLine, AppAutoscalerMetricDataPoint } from '../../../../../store/app-autoscaler.types';

function formatLabel(label: any): string {
  if (label instanceof Date) {
    label = label.toLocaleDateString();
  } else {
    label = label.toLocaleString();
  }

  return label;
}

/* tslint:disable:component-selector  */
@Component({
  selector: 'g[ngx-combo-charts-series-vertical]',
  template: `
    @for (bar of bars; track trackBy($index, bar)) {
      <svg:g ngx-charts-bar
        [@animationState]="'active'"
        [width]="bar.width"
        [height]="bar.height"
        [x]="bar.x"
        [y]="bar.y"
        [fill]="bar.color"
        [stops]="bar.gradientStops"
        [data]="bar.data"
        [orientation]="'vertical'"
        [roundEdges]="bar.roundEdges"
        [gradient]="gradient()"
        [isActive]="isActive(bar.data)"
        [animations]="animations()"
        (select)="onClick($event)"
        (activate)="activate.emit($event)"
        (deactivate)="deactivate.emit($event)"
        ngx-tooltip
        [tooltipDisabled]="tooltipDisabled()"
        [tooltipPlacement]="'top'"
        [tooltipType]="'tooltip'"
        [tooltipTitle]="bar.tooltipText">
        </svg:g>
      }
    `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [],
  animations: [
    trigger('animationState', [
      transition('* => void', [
        style({
          opacity: 1,
          transform: '*'
        }),
        animate(500, style({ opacity: 0, transform: 'scale(0)' }))
      ])
    ])
  ]
})
export class AppAutoscalerComboSeriesVerticalComponent implements OnChanges {

  readonly dims = input<any>();
  readonly type = input('standard');
  readonly series = input<any[]>([]);
  readonly seriesLine = input<any[]>([]);
  readonly xScale = input<any>();
  readonly yScale = input<any>();
  readonly colors = input<any>();
  readonly tooltipDisabled = input(false);
  readonly gradient = input<boolean>();
  readonly activeEntries = input<AppAutoscalerMetricDataLine[]>();
  readonly seriesName = input<string>();
  readonly animations = input(true);

  // eslint-disable-next-line @angular-eslint/no-output-native -- intentional ngx-charts API parity: re-emits the wrapped series' (select) event under the same name
  readonly select = output();
  readonly activate = output();
  readonly deactivate = output();
  readonly bandwidth = output<number>();

  bars!: any[];
  x: any;
  y: any;

  ngOnChanges(_changes: SimpleChanges): void {
    this.update();
  }

  update(): void {
    let width: number;
    const series = this.series();
    if (series.length) {
      width = this.xScale().bandwidth();
      this.bandwidth.emit(width);
    }

    let d0 = 0;
    let total: number;
    if (this.type() === 'normalized') {
      total = series.map((d: any) => d.value).reduce((sum: number, d: any) => sum + d, 0);
    }

    this.bars = series.map((d: any, index: number) => {

      let value = d.value;
      const label = d.name;
      const formattedLabel = formatLabel(label);
      const roundEdges = this.type() === 'standard';

      const bar: any = {
        value,
        label,
        roundEdges,
        data: d,
        width,
        formattedLabel,
        height: 0,
        x: 0,
        y: 0
      };

      const type = this.type();
      if (type === 'standard') {
        bar.height = Math.abs(this.yScale()(value) - this.yScale()(0));
        bar.x = this.xScale()(label);

        if (value < 0) {
          bar.y = this.yScale()(0);
        } else {
          bar.y = this.yScale()(value);
        }
      } else if (type === 'stacked') {
        const offset0 = d0;
        const offset1 = offset0 + value;
        d0 += value;

        bar.height = this.yScale()(offset0) - this.yScale()(offset1);
        bar.x = 0;
        bar.y = this.yScale()(offset1);
        bar.offset0 = offset0;
        bar.offset1 = offset1;
      } else if (type === 'normalized') {
        let offset0 = d0;
        let offset1 = offset0 + value;
        d0 += value;

        if (total > 0) {
          offset0 = (offset0 * 100) / total;
          offset1 = (offset1 * 100) / total;
        } else {
          offset0 = 0;
          offset1 = 0;
        }

        bar.height = this.yScale()(offset0) - this.yScale()(offset1);
        bar.x = 0;
        bar.y = this.yScale()(offset1);
        bar.offset0 = offset0;
        bar.offset1 = offset1;
        value = (offset1 - offset0).toFixed(2);
      }

      const colors = this.colors();
      if (colors.scaleType === 'ordinal') {
        bar.color = colors.getColor(label);
      } else {
        if (type === 'standard') {
          bar.color = colors.getColor(value);
          bar.gradientStops = colors.getLinearGradientStops(value);
        } else {
          bar.color = colors.getColor(bar.offset1);
          bar.gradientStops = colors.getLinearGradientStops(bar.offset1, bar.offset0);
        }
      }

      let tooltipLabel = formattedLabel;
      const seriesName = this.seriesName();
      if (seriesName) {
        tooltipLabel = `${seriesName} • ${formattedLabel}`;
      }

      const seriesLine = this.seriesLine();
      this.getSeriesTooltips(seriesLine, index);
      const lineValue = seriesLine[0].series[index].value;
      const _lineName = seriesLine[0].series[index].name;
      bar.tooltipText = `
        <span class="tooltip-label">${tooltipLabel}</span>
        <span class="tooltip-val"> Y1 - ${value.toLocaleString()} • Y2 - ${lineValue.toLocaleString()}%</span>
      `;

      return bar;
    });
  }

  getSeriesTooltips(seriesLine: AppAutoscalerMetricDataLine[], index: number): AppAutoscalerMetricDataPoint[] {
    return seriesLine.map(d => {
      return d.series[index];
    });
  }

  isActive(entry: AppAutoscalerMetricDataLine): boolean {
    const activeEntries = this.activeEntries();
    if (!activeEntries) {
      return false;
    }
    const item = activeEntries.find(d => {
      return entry.name === d.name && entry.series === d.series;
    });
    return item !== undefined;
  }

  onClick(data: any): void {
    this.select.emit(data);
  }

  trackBy(index: number, bar: any): string {
    return bar.label;
  }

}
