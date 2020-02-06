import { Pipe, PipeTransform } from '@angular/core';

import { UtilsService } from '../../core/utils.service';

@Pipe({
  name: 'usageBytes'
})
export class UsageBytesPipe implements PipeTransform {

  constructor(private utils: UtilsService) {}

  transform(mb): string {
    return this.utils.usageBytes(mb);
  }
}
