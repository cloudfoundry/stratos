import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { RouterTestingModule } from '@angular/router/testing';

import { PanelComponent } from '../../panel/panel.component';
import { MockChartService } from '../../shared/services/chart.service.mock';
import { ChartsService } from '../../shared/services/charts.service';
import { ChartDetailsVersionsComponent } from './chart-details-versions.component';

describe('ChartDetailsVersionsComponent', () => {
  let component: ChartDetailsVersionsComponent;
  let fixture: ComponentFixture<ChartDetailsVersionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        RouterTestingModule,
        ChartDetailsVersionsComponent,
        PanelComponent,
      ],
      providers: [
        { provide: ChartsService, useValue: new MockChartService() },
        provideZonelessChangeDetection(),
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ChartDetailsVersionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
