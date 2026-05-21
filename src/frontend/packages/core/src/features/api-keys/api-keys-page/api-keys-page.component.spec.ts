import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { provideMockStore } from '@ngrx/store/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { TailwindDialogService } from '../../../shared/services/tailwind-dialog.service';
import { ApiKeysPageComponent } from './api-keys-page.component';

describe('ApiKeysPageComponent', () => {
  let component: ApiKeysPageComponent;
  let fixture: ComponentFixture<ApiKeysPageComponent>;

  const mockDialogService = {
    open: vi.fn(),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ApiKeysPageComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideNoopAnimations(),
        provideMockStore({ initialState: {} }),
        { provide: TailwindDialogService, useValue: mockDialogService },
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ApiKeysPageComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
