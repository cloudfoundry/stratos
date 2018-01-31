import { inject, TestBed } from '@angular/core/testing';

import { UtilsService } from '../../core/utils.service';
import { MbToHumanSizePipe } from './mb-to-human-size.pipe';




describe('MbToHumanSizePipe', () => {

  let pipe;

  beforeEach(() => TestBed.configureTestingModule({
    providers: [
      MbToHumanSizePipe,
      UtilsService
    ]
  }));

  beforeEach(inject([MbToHumanSizePipe], p => {
    pipe = p;
  }));

  it('create an instance', () => {
    expect(pipe).toBeTruthy();
  });
});
