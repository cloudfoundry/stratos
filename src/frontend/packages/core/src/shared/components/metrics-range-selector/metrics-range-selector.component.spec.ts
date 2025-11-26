import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { createBasicStoreModule, STORE_TEST_PROVIDERS } from "@test-framework/core-test.helper";
import { CoreTestingModule } from "@test-framework/core-test.modules";
import { CoreModule } from '../../../core/core.module';
import { MetricsRangeSelectorService } from '../../services/metrics-range-selector.service';
import { MetricsRangeSelectorComponent } from './metrics-range-selector.component';

describe('MetricsRangeSelectorComponent', () => {
  let component: MetricsRangeSelectorComponent;
  let fixture: ComponentFixture<MetricsRangeSelectorComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        MetricsRangeSelectorComponent,
        CoreModule,
        CoreTestingModule,
        createBasicStoreModule(),
        NoopAnimationsModule,
      ],
      providers: [
        ...STORE_TEST_PROVIDERS,
        MetricsRangeSelectorService,
        provideZonelessChangeDetection(),
      ]
    });
      TestBed.compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MetricsRangeSelectorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
