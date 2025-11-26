import { animate, style, transition, trigger } from '@angular/animations';

import { ChangeDetectionStrategy, Component, EventEmitter, Input, type OnChanges, Output, type SimpleChanges } from '@angular/core';

import type { AppAutoscalerMetricDataLine, AppAutoscalerMetricDataPoint } from '../../../../../store/app-autoscaler.types';

interface ScaleBand {
  bandwidth(): number;
  (value: string | number): number | undefined;
}

type ScaleLinear = (value: number) => number

interface ColorHelper {
  scaleType: string;
  getColor(value: string | number): string;
  getLinearGradientStops(value: number, value2?: number): string[];
}

interface SeriesItem {
  name: string | number;
  value: number;
}

interface BarItem {
  value: number;
  label: string | number;
  roundEdges: boolean;
  data: SeriesItem;
  width: number;
  formattedLabel: string;
  height: number;
  x: number;
  y: number;
  color?: string;
  gradientStops?: string[];
  offset0?: number;
  offset1?: number;
  tooltipText?: string;
}

function formatLabel(label: string | number | Date): string {
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
        [gradient]="gradient"
        [isActive]="isActive(bar.data)"
        [animations]="animations"
        (select)="onClick($event)"
        (activate)="activate.emit($event)"
        (deactivate)="deactivate.emit($event)"
        ngx-tooltip
        [tooltipDisabled]="tooltipDisabled"
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

  @Input() dims!: { width: number; height: number };
  @Input() type = 'standard';
  @Input() series!: SeriesItem[];
  @Input() seriesLine!: AppAutoscalerMetricDataLine[];
  @Input() xScale!: ScaleBand;
  @Input() yScale!: ScaleLinear;
  @Input() colors!: ColorHelper;
  @Input() tooltipDisabled = false;
  @Input() gradient!: boolean;
  @Input() activeEntries!: AppAutoscalerMetricDataLine[];
  @Input() seriesName!: string;
  @Input() animations = true;

  @Output() select = new EventEmitter();
  @Output() activate = new EventEmitter();
  @Output() deactivate = new EventEmitter();
  @Output() bandwidth = new EventEmitter<number>();

  bars!: BarItem[];
  x!: number;
  y!: number;

  ngOnChanges(_changes: SimpleChanges): void {
    this.update();
  }

  update(): void {
    let width: number;
    if (this.series.length) {
      width = this.xScale.bandwidth();
      this.bandwidth.emit(width);
    }

    let d0 = 0;
    let total = 0;
    if (this.type === 'normalized') {
      total = this.series.map((d) => d.value).reduce((sum: number, d: number) => sum + d, 0);
    }

    this.bars = this.series.map((d, index: number) => {

      let value = d.value;
      const label = d.name;
      const formattedLabel = formatLabel(label);
      const roundEdges = this.type === 'standard';

      const bar: BarItem = {
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

      if (this.type === 'standard') {
        bar.height = Math.abs(this.yScale(value) - this.yScale(0));
        bar.x = this.xScale(label);

        if (value < 0) {
          bar.y = this.yScale(0);
        } else {
          bar.y = this.yScale(value);
        }
      } else if (this.type === 'stacked') {
        const offset0 = d0;
        const offset1 = offset0 + value;
        d0 += value;

        bar.height = this.yScale(offset0) - this.yScale(offset1);
        bar.x = 0;
        bar.y = this.yScale(offset1);
        bar.offset0 = offset0;
        bar.offset1 = offset1;
      } else if (this.type === 'normalized') {
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

        bar.height = this.yScale(offset0) - this.yScale(offset1);
        bar.x = 0;
        bar.y = this.yScale(offset1);
        bar.offset0 = offset0;
        bar.offset1 = offset1;
        value = parseFloat((offset1 - offset0).toFixed(2));
      }

      if (this.colors.scaleType === 'ordinal') {
        bar.color = this.colors.getColor(label);
      } else {
        if (this.type === 'standard') {
          bar.color = this.colors.getColor(value);
          bar.gradientStops = this.colors.getLinearGradientStops(value);
        } else {
          bar.color = this.colors.getColor(bar.offset1);
          bar.gradientStops = this.colors.getLinearGradientStops(bar.offset1, bar.offset0);
        }
      }

      let tooltipLabel = formattedLabel;
      if (this.seriesName) {
        tooltipLabel = `${this.seriesName} • ${formattedLabel}`;
      }

      this.getSeriesTooltips(this.seriesLine, index);
      const lineValue = this.seriesLine[0].series[index].value;
      const _lineName = this.seriesLine[0].series[index].name;
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
    if (!this.activeEntries) {
      return false;
    }
    const item = this.activeEntries.find(d => {
      return entry.name === d.name && entry.series === d.series;
    });
    return item !== undefined;
  }

  onClick(data: SeriesItem): void {
    this.select.emit(data);
  }

  trackBy(_index: number, bar: BarItem): string {
    return String(bar.label);
  }

}
