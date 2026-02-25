import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { UtilsService } from '../../core/utils.service';
import { MbToHumanSizePipe } from './mb-to-human-size.pipe';


describe('MbToHumanSizePipe', () => {
  let pipe: MbToHumanSizePipe;
  let utilsService: UtilsService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        
        MbToHumanSizePipe,
        UtilsService,
        provideZonelessChangeDetection(),
      ]
    });

    utilsService = TestBed.inject(UtilsService);
    pipe = TestBed.inject(MbToHumanSizePipe);
  });

  it('create an instance', () => {
    expect(pipe).toBeTruthy();
  });

  it('should call utils method', () => {
    vi.spyOn(utilsService, 'mbToHumanSize');
    pipe.transform(1024);

    expect(utilsService.mbToHumanSize).toHaveBeenCalledWith(1024);
  });

  it('should transform the number', () => {
    expect(pipe.transform(1024)).toEqual('1 GB');
  });
});
