import { inject, TestBed } from '@angular/core/testing';

import { UtilsService } from '../../core/utils.service';
import { MbToHumanSizePipe } from './mb-to-human-size.pipe';


describe('MbToHumanSizePipe', () => {
  let pipe: MbToHumanSizePipe;
  let utilsService: UtilsService;

  beforeEach(() => TestBed.configureTestingModule({
    providers: [
      MbToHumanSizePipe,
      UtilsService
    ]
  }));

  beforeEach(inject([MbToHumanSizePipe], (p: MbToHumanSizePipe) => {
    utilsService = TestBed.get(UtilsService);
    pipe = p;
  }));

  it('create an instance', () => {
    expect(pipe).toBeTruthy();
  });

  it('should call utils method', () => {
    spyOn(utilsService, 'mbToHumanSize');
    pipe.transform(1024);

    expect(utilsService.mbToHumanSize).toHaveBeenCalledWith(1024);
  });

  it('should transform the number', () => {
    expect(pipe.transform(1024)).toEqual('1 GB');
  });
});
