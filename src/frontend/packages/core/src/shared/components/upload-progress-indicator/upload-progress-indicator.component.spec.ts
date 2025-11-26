import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';

import { UploadProgressIndicatorComponent } from './upload-progress-indicator.component';
import { MDAppModule } from '../../../core/md.module';
import { CommonModule } from '@angular/common';
import { CoreModule } from '../../../core/core.module';

describe('UploadProgressIndicatorComponent', () => {
  let component: UploadProgressIndicatorComponent;
  let fixture: ComponentFixture<UploadProgressIndicatorComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideZonelessChangeDetection()
      ],
      imports: [
        UploadProgressIndicatorComponent,
        MDAppModule,
        CommonModule,
        CoreModule,
      ]
    });
    TestBed.compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(UploadProgressIndicatorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
