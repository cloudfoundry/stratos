import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'tableCellAutoscalerEventChangeIcon'
})
export class TableCellAutoscalerEventChangeIconPipe implements PipeTransform {

  private result(outputType: string, value: number, cssClass: string, icon: string) {
    switch (outputType) {
      case 'class':
        return cssClass;
      case 'icon':
        return icon;
      default:
        return '';
    }
  }

  transform(value: number, args?: string): string {
    if (!args || !args.length) {
      return '';
    }
    if (value > 0) {
      return this.result(args, value, 'text-danger', 'trending_up');
    } else if (value < 0) {
      return this.result(args, value, 'text-success', 'trending_down');
    } else {
      return this.result(args, value, 'text-tentative', 'trending_flat');
    }
  }
}
