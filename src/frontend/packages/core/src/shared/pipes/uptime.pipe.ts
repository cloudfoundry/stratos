import { Pipe, type PipeTransform, inject } from '@angular/core';

import { UtilsService } from '../../core/utils.service';

@Pipe({
name: 'uptime',
standalone: true
})
export class UptimePipe implements PipeTransform {
  private utils = inject(UtilsService);

  transform(uptime: number | string): string {
    if (uptime === 'offline') {
      return 'Offline';
    }
    return this.utils.formatUptime(uptime as number);
  }
}
