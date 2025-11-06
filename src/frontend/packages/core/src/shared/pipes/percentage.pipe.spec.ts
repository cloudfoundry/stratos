import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { UtilsService } from '../../core/utils.service';
import { PercentagePipe } from './percentage.pipe';


describe('PercentagePipe', () => {
  let pipe: PercentagePipe;
  let utilsService: UtilsService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        PercentagePipe,
        UtilsService
      ]
    });

    utilsService = TestBed.inject(UtilsService);
    pipe = TestBed.inject(PercentagePipe);
  });

  it('create an instance', () => {
    expect(pipe).toBeTruthy();
  });

  it('should call utils method', () => {
    vi.spyOn(utilsService, 'percent');
    pipe.transform(1024);

    expect(utilsService.percent).toHaveBeenCalledWith(1024);
  });

  it('should transform the number', () => {
    expect(pipe.transform(0.234)).toEqual('23.40%');
  });
});
