import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'tableCellAutoscalerEventStatusIcon'
})
export class TableCellAutoscalerEventStatusIconPipe implements PipeTransform {

  private result(outputType: string, value: number, cssClass: string, icon: string, label: string) {
    switch (outputType) {
      case 'class':
        return cssClass;
      case 'icon':
        return icon;
      case 'label':
        return label;
      default:
        return '';
    }
  }

  transform(value: number, args?: string): string {
    if (!args || !args.length) {
      return '';
    }
    switch (value) {
      case 0:
        return this.result(args, value, 'text-success', 'lens', 'succeeded');
      case 1:
        return this.result(args, value, 'text-danger', 'warning', 'failed');
      case 2:
        return this.result(args, value, 'text-tentative', 'broken_image', 'ignored');
      default:
        return '';
    }

  }

}
