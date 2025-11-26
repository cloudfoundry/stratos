import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideStore } from '@ngrx/store';
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
        provideStore(),
        UtilsService,
      ]
    });
    TestBed.compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CardNumberMetricComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
