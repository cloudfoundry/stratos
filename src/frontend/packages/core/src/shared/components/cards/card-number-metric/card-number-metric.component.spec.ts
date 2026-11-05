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

  it('counts the alerts at each level', async () => {
    // Levels: 0 ok, 1 info, 2 warning, 3 error.
    fixture.componentRef.setInput('alerts', [{ level: 0 }, { level: 1 }, { level: 2 }, { level: 2 }, { level: 3 }]);
    await fixture.whenStable();

    const count = (level: string) =>
      fixture.nativeElement.querySelector(`.alert-${level} span:last-child`)?.textContent;
    expect(count('info')).toBe('1');
    expect(count('warning')).toBe('2');
    expect(count('danger')).toBe('1');
  });

  it('shows no alert badges without a list of alerts', () => {
    expect(fixture.nativeElement.querySelector('.number-metric-card-alerts')).toBeNull();
  });
});
