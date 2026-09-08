import { Pipe, PipeTransform, inject } from '@angular/core';

import { UtilsService } from '../../core/utils.service';

@Pipe({
name: 'mbToHumanSize',
standalone: true
})
export class MbToHumanSizePipe implements PipeTransform {
  private utilsService = inject(UtilsService);

  transform(mb: number | null | undefined): string {
    return this.utilsService.mbToHumanSize(mb);
  }

}
