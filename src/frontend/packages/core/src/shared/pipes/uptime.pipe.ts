import { Pipe, PipeTransform } from '@angular/core';

import { UtilsService } from '../../core/utils.service';

@Pipe({
  name: 'uptime'
})
export class UptimePipe implements PipeTransform {

  constructor(private utils: UtilsService) { }

  transform(uptime): string {
    if (uptime === 'offline') {
      return 'Offline';
    }
    return this.utils.formatUptime(uptime);
  }
}
