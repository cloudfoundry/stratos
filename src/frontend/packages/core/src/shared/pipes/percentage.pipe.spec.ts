import { inject, TestBed } from '@angular/core/testing';

import { UtilsService } from '../../core/utils.service';
import { PercentagePipe } from './percentage.pipe';


describe('PercentagePipe', () => {
  let pipe: PercentagePipe;
  let utilsService: UtilsService;

  beforeEach(() => TestBed.configureTestingModule({
    providers: [
      PercentagePipe,
      UtilsService
    ]
  }));

  beforeEach(inject([PercentagePipe], (p: PercentagePipe) => {
    utilsService = TestBed.get(UtilsService);
    pipe = p;
  }));

  it('create an instance', () => {
    expect(pipe).toBeTruthy();
  });

  it('should call utils method', () => {
    spyOn(utilsService, 'percent');
    pipe.transform(1024);

    expect(utilsService.percent).toHaveBeenCalledWith(1024);
  });

  it('should transform the number', () => {
    expect(pipe.transform(0.234)).toEqual('23.40%');
  });
});
