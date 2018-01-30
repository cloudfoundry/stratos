import { MockBackend } from '@angular/http/testing';
import { XHRBackend } from '@angular/http';
import { CoreModule } from './core.module';
import { TestBed, inject } from '@angular/core/testing';

import { LoggerService } from './logger.service';
import { createBasicStoreModule } from '../test-framework/store-test-helper';

describe('LoggerService', () => {

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        LoggerService
      ],
      imports: [
        createBasicStoreModule(),
      ]
    });
  });

  it('should be created', inject([LoggerService], (service: LoggerService) => {
    expect(service).toBeTruthy();
  }));
});
