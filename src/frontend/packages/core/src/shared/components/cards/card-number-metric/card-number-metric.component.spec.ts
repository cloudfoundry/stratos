import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';

import { UtilsService } from '@stratosui/core';
import { CardNumberMetricComponent } from './card-number-metric.component';

describe('CardNumberMetricComponent', () => {
  let component: CardNumberMetricComponent;
  let fixture: ComponentFixture<CardNumberMetricComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [CardNumberMetricComponent],
      providers: [
        provideZonelessChangeDetection(),
        UtilsService,
      ]
    });
    TestBed.compileComponents();
  });

  beforeEach(async () => {
    fixture = TestBed.createComponent(CardNumberMetricComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('icon', 'memory');
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
