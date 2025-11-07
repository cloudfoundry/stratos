import { TestBed, inject } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';

import { ConfirmationDialogService } from './confirmation-dialog.service';
import { TailwindDialogService } from '@stratosui/core';
import { CoreModule } from '../../core/core.module';

describe('ConfirmationDialogService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        
        ConfirmationDialogService,
        TailwindDialogService,

        provideZonelessChangeDetection(),
      ],
      imports: [
        CoreModule,
      ]
    });
  });

  it('should be created', inject([ConfirmationDialogService], (service: ConfirmationDialogService) => {
    expect(service).toBeTruthy();
  }));
});
