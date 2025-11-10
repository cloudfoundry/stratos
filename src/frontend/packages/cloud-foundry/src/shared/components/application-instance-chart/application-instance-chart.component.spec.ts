import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, importProvidersFrom } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { createBasicStoreModule, STORE_TEST_PROVIDERS } from '@stratosui/store/testing';

import { ApplicationInstanceChartComponent } from "./application-instance-chart.component";

describe('ApplicationInstanceChartComponent', () => {
  let component: ApplicationInstanceChartComponent;
  let fixture: ComponentFixture<ApplicationInstanceChartComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        ApplicationInstanceChartComponent,
      ],
      providers: [
        provideZonelessChangeDetection(),
        importProvidersFrom(createBasicStoreModule()),
        ...STORE_TEST_PROVIDERS,
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ApplicationInstanceChartComponent);
    component = fixture.componentInstance;

    // Don't call detectChanges() to avoid initializing child components
    // and triggering ngOnInit which requires inputs to be set
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
