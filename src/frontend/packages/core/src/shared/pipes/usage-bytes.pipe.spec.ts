import { inject, TestBed } from '@angular/core/testing';

import { UtilsService } from '../../core/utils.service';
import { UsageBytesPipe } from './usage-bytes.pipe';


describe('UsageBytesPipe', () => {
  let pipe: UsageBytesPipe;
  let utilsService: UtilsService;

  beforeEach(() => TestBed.configureTestingModule({
    providers: [
      UsageBytesPipe,
      UtilsService
    ]
  }));

  beforeEach(inject([UsageBytesPipe], (p: UsageBytesPipe) => {
    utilsService = TestBed.get(UtilsService);
    pipe = p;
  }));

  it('create an instance', () => {
    expect(pipe).toBeTruthy();
  });

  it('should call utils method', () => {
    spyOn(utilsService, 'usageBytes');
    pipe.transform([100, 1024]);

    expect(utilsService.usageBytes).toHaveBeenCalledWith([100, 1024]);
  });

  it('should transform the input', () => {
    expect(pipe.transform([100, 1000])).toEqual('100 / 1000 bytes');
  });
});
