import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach } from 'vitest';
import { BaseTestModulesNoShared, STORE_TEST_PROVIDERS } from '@test-framework/core-test.helper';
import { CardBooleanMetricComponent } from './card-boolean-metric.component';

describe('CardBooleanMetricComponent', () => {
  let component: CardBooleanMetricComponent;
  let fixture: ComponentFixture<CardBooleanMetricComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        CardBooleanMetricComponent,
        ...BaseTestModulesNoShared,
      ],
      providers: [
        ...(STORE_TEST_PROVIDERS || []),
        provideZonelessChangeDetection(),
      ]
    });
      TestBed.compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CardBooleanMetricComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
