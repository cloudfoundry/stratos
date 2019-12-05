import { Pipe, PipeTransform } from '@angular/core';

import { UtilsService } from '../../core/utils.service';

@Pipe({
  name: 'percentage'
})
export class PercentagePipe implements PipeTransform {

  constructor(private utils: UtilsService) {}

  transform(mb: number): string {
    return this.utils.percent(mb);
  }

}
