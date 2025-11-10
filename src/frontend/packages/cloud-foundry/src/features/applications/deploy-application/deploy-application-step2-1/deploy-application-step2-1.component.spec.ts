import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { Store } from '@ngrx/store';
import { of } from 'rxjs';

import { DeployApplicationStep21Component } from './deploy-application-step2-1.component';

describe('DeployApplicationStep21Component', () => {
  let component: DeployApplicationStep21Component;
  let fixture: ComponentFixture<DeployApplicationStep21Component>;

  // Mock Store
  const mockStore = {
    dispatch: vi.fn(),
    select: vi.fn(() => of({})),
    pipe: vi.fn(() => of({}))
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        DeployApplicationStep21Component,
      ],
      providers: [
        provideZonelessChangeDetection(),
        { provide: Store, useValue: mockStore },
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DeployApplicationStep21Component);
    component = fixture.componentInstance;
    // Don't call detectChanges() to avoid triggering lifecycle hooks
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
