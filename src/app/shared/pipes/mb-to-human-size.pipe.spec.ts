import { inject } from '@angular/core/testing';

import { UtilsService } from '../../core/utils.service';
import { MbToHumanSizePipe } from './mb-to-human-size.pipe';

describe('MbToHumanSizePipe', () => {
  it('create an instance', inject([UtilsService], (service: UtilsService) => {
    const pipe = new MbToHumanSizePipe(service);
    expect(pipe).toBeTruthy();
  }));
});
