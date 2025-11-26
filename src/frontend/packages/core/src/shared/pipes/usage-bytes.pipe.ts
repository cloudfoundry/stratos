import { Pipe, type PipeTransform, inject } from '@angular/core';

import { UtilsService } from '../../core/utils.service';

@Pipe({
name: 'usageBytes',
standalone: true
})
export class UsageBytesPipe implements PipeTransform {
  private utils = inject(UtilsService);

  transform(mb: number | number[]): string {
    // Convert single number to array format expected by usageBytes
    const usage = Array.isArray(mb) ? mb : [mb];
    return this.utils.usageBytes(usage);
  }
}
