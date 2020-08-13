import { Pipe, PipeTransform } from '@angular/core';

import { UtilsService } from '../../core/utils.service';

@Pipe({
  name: 'mbToHumanSize'
})
export class MbToHumanSizePipe implements PipeTransform {
  constructor(private utilsService: UtilsService) {
  }

  transform(mb: number): string {
    return this.utilsService.mbToHumanSize(mb);
  }

}
