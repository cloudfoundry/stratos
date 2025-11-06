import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { UtilsService } from '../../core/utils.service';
import { UsageBytesPipe } from './usage-bytes.pipe';


describe('UsageBytesPipe', () => {
  let pipe: UsageBytesPipe;
  let utilsService: UtilsService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        
        UsageBytesPipe,
        UtilsService
      ,
        provideZonelessChangeDetection()
      ]
    });

    utilsService = TestBed.inject(UtilsService);
    pipe = TestBed.inject(UsageBytesPipe);
  });

  it('create an instance', () => {
    expect(pipe).toBeTruthy();
  });

  it('should call utils method', () => {
    vi.spyOn(utilsService, 'usageBytes');
    pipe.transform([100, 1024]);

    expect(utilsService.usageBytes).toHaveBeenCalledWith([100, 1024]);
  });

  it('should transform the input', () => {
    expect(pipe.transform([100, 1000])).toEqual('100 / 1000 bytes');
  });
});
