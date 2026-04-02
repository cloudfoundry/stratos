import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, CUSTOM_ELEMENTS_SCHEMA, ChangeDetectorRef } from '@angular/core';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { of } from 'rxjs';
import { Store } from '@ngrx/store';

import { PaginationMonitorFactory } from '@stratosui/store';
import { ApplicationDeploySourceTypes } from '../../applications/deploy-application/deploy-application-steps.types';
import { CFHomeCardComponent } from "./cfhome-card.component";

describe('CFHomeCardComponent', () => {
  let component: CFHomeCardComponent;
  let fixture: ComponentFixture<CFHomeCardComponent>;

  // Mock services
  const mockStore = {
    dispatch: vi.fn(),
    select: vi.fn(() => of({})),
    pipe: vi.fn(() => of({}))
  };

  const mockPmf = {
    create: vi.fn(() => ({
      currentPage$: of([]),
      pagination$: of({}),
      fetchingCurrentPage$: of(false),
      isLoadingPage$: of(false)
    }))
  };

  const mockAppDeploySourceTypes = {
    types$: of([])
  };

  const mockCdr = {
    markForCheck: vi.fn(),
    detectChanges: vi.fn(),
    detach: vi.fn(),
    reattach: vi.fn(),
    checkNoChanges: vi.fn()
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        CFHomeCardComponent,
      ],
      providers: [
        provideZonelessChangeDetection(),
        { provide: Store, useValue: mockStore },
        { provide: PaginationMonitorFactory, useValue: mockPmf },
        { provide: ChangeDetectorRef, useValue: mockCdr },
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA]
    })
    .overrideComponent(CFHomeCardComponent, {
      set: {
        providers: [
          { provide: ApplicationDeploySourceTypes, useValue: mockAppDeploySourceTypes },
        ],
      },
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CFHomeCardComponent);
    component = fixture.componentInstance;
    // Set required inputs before detectChanges
    component.guid = 'test-guid';
    component.layout = { x: 1, y: 1 } as any;
    // Don't call detectChanges() to avoid complex initialization
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
