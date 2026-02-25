import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { UtilsService } from '../../core/utils.service';
import { UptimePipe } from './uptime.pipe';


describe('UptimePipe', () => {
  let pipe: UptimePipe;
  let utilsService: UtilsService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        
        UptimePipe,
        UtilsService,
        provideZonelessChangeDetection(),
      ]
    });

    utilsService = TestBed.inject(UtilsService);
    pipe = TestBed.inject(UptimePipe);
  });

  it('create an instance', () => {
    expect(pipe).toBeTruthy();
  });

  it('should call utils method', () => {
    vi.spyOn(utilsService, 'formatUptime');
    pipe.transform(1024);

    expect(utilsService.formatUptime).toHaveBeenCalledWith(1024);
  });

  it('should transform the number of seconds', () => {
    expect(pipe.transform(100)).toEqual('1m 40s');
  });

  it('should return Offline if offline', () => {
    expect(pipe.transform('offline')).toEqual('Offline');
  });
});
