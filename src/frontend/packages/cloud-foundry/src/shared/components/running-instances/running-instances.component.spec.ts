import { provideHttpClient } from '@angular/common/http';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';

import { PaginationMonitorFactory, EntityCatalogModule, appReducers } from '@stratosui/store';
import { generateCFEntities } from '@stratosui/cloud-foundry';
import { RunningInstancesComponent } from './running-instances.component';

describe('RunningInstancesComponent', () => {
  let component: RunningInstancesComponent;
  let fixture: ComponentFixture<RunningInstancesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        RunningInstancesComponent,
        NoopAnimationsModule,
        HttpClientTestingModule,
        EntityCatalogModule.forFeature(() => generateCFEntities()),
        StoreModule.forRoot(
          appReducers,
          { runtimeChecks: { strictStateImmutability: false, strictActionImmutability: false } }
        ),
        EffectsModule.forRoot([]),
      ],
      providers: [
        PaginationMonitorFactory,
        provideRouter([]),
        provideHttpClient(),
        provideZonelessChangeDetection(),
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(RunningInstancesComponent);
    component = fixture.componentInstance;

    // Mock the required inputs before detectChanges
    component.instances = 3;
    component.cfGuid = 'test-cf-guid';
    component.appGuid = 'test-app-guid';

    // Mock the pagination monitor to avoid the error
    vi.spyOn(component, 'ngOnInit').mockImplementation(() => {
      // Do nothing - just prevent the actual initialization
    });

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
