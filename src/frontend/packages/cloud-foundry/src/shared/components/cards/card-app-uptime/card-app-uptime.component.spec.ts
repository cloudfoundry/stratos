import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { describe, it, expect } from 'vitest';

import { AppDetailDataService } from '../../../../features/applications/app-detail-data.service';
import { CardAppUptimeComponent } from "./card-app-uptime.component";

function makeDataServiceStub(running: boolean, stats: any[] = []) {
  return {
    running: () => running,
    stats: () => stats,
  };
}

describe('CardAppUptimeComponent', () => {
  let component: CardAppUptimeComponent;
  let fixture: ComponentFixture<CardAppUptimeComponent>;

  function setUp(running: boolean, stats: any[] = []) {
    TestBed.configureTestingModule({
      imports: [CardAppUptimeComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: AppDetailDataService, useValue: makeDataServiceStub(running, stats) },
      ],
    });
    fixture = TestBed.createComponent(CardAppUptimeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  it('renders the not-running state when the app is stopped', () => {
    setUp(false);
    expect(fixture.nativeElement.textContent).toContain('not running');
  });

  it('renders max uptime when one instance is running', () => {
    setUp(true, [{ index: 0, state: 'RUNNING', uptime: 3600 }]);
    expect(component.appData().maxUptime).toBe(3600);
    expect(component.appData().runningCount).toBe(1);
  });

  it('renders min/avg detail when more than one instance is running', () => {
    setUp(true, [
      { index: 0, state: 'RUNNING', uptime: 1000 },
      { index: 1, state: 'RUNNING', uptime: 3000 },
    ]);
    const data = component.appData();
    expect(data.maxUptime).toBe(3000);
    expect(data.minUptime).toBe(1000);
    expect(data.averageUptime).toBe(2000);
    expect(data.runningCount).toBe(2);
  });

  it('ignores non-RUNNING instances in the aggregates', () => {
    setUp(true, [
      { index: 0, state: 'RUNNING', uptime: 500 },
      { index: 1, state: 'CRASHED', uptime: 0 },
    ]);
    expect(component.appData().runningCount).toBe(1);
    expect(component.appData().maxUptime).toBe(500);
  });
});
