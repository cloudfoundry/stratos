import { Pipe, PipeTransform, inject } from '@angular/core';

import { UtilsService } from '../../core/utils.service';

@Pipe({
name: 'usageBytes',
standalone: true
})
export class UsageBytesPipe implements PipeTransform {
  private utils = inject(UtilsService);

  transform(mb: number | number[]): string {
    return this.utils.usageBytes(mb as any);
  }
}
