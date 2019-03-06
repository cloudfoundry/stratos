import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'tableCellAutoscalerEventActionLabel'
})
export class TableCellAutoscalerEventActionLabelPipe implements PipeTransform {
  transform(value: number): string {
    if (value['message']) {
      const change = value['new_instances'] - value['old_instances'];
      if (change >= 0) {
        return '+' + change + ' instance(s) because ' + value['message'];
      } else {
        return change + ' instance(s) because ' + value['message'];
      }
    } else {
      return value['reason'];
    }
  }
}
