import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach } from 'vitest';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { createBasicStoreModule, STORE_TEST_PROVIDERS } from '@test-framework';

import { MetricsRangeSelectorService } from '../../services/metrics-range-selector.service';
import { MetricsParentRangeSelectorComponent } from './metrics-parent-range-selector.component';

describe('MetricsParentRangeSelectorComponent', () => {
  let component: MetricsParentRangeSelectorComponent;
  let fixture: ComponentFixture<MetricsParentRangeSelectorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        NoopAnimationsModule,
        MetricsParentRangeSelectorComponent,
        createBasicStoreModule(),
      ],
      providers: [
        ...STORE_TEST_PROVIDERS,
        MetricsRangeSelectorService,
        provideZonelessChangeDetection(),
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MetricsParentRangeSelectorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
