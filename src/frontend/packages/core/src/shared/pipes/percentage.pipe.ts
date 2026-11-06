import { Pipe, PipeTransform, inject } from '@angular/core';

import { UtilsService } from '../../core/utils.service';

@Pipe({
  name: 'percentage',
  standalone: true
})
export class PercentagePipe implements PipeTransform {
  private utils = inject(UtilsService);

  transform(mb: number): string {
    return this.utils.percent(mb);
  }

}
