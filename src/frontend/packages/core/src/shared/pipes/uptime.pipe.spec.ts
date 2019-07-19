import { inject, TestBed } from '@angular/core/testing';

import { UtilsService } from '../../core/utils.service';
import { UptimePipe } from './uptime.pipe';


describe('UptimePipe', () => {
  let pipe: UptimePipe;
  let utilsService: UtilsService;

  beforeEach(() => TestBed.configureTestingModule({
    providers: [
      UptimePipe,
      UtilsService
    ]
  }));

  beforeEach(inject([UptimePipe], (p: UptimePipe) => {
    utilsService = TestBed.get(UtilsService);
    pipe = p;
  }));

  it('create an instance', () => {
    expect(pipe).toBeTruthy();
  });

  it('should call utils method', () => {
    spyOn(utilsService, 'formatUptime');
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
