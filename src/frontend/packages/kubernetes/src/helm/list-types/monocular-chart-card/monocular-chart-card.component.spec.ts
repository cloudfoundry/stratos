import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { RouterTestingModule } from '@angular/router/testing';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';

import { EntityServiceFactory } from '@stratosui/store';
import { BaseTestModulesNoShared } from '../../../../../core/test-framework/core-test.helper';
import { ChartItemComponent } from '../../monocular/chart-item/chart-item.component';
import { ListItemComponent } from '../../monocular/list-item/list-item.component';
import { MockChartService } from '../../monocular/shared/services/chart.service.mock';
import { ChartsService } from '../../monocular/shared/services/charts.service';
import { ConfigService } from '../../monocular/shared/services/config.service';
import type { MonocularChart } from '../../store/helm.types';
import { MonocularChartCardComponent } from './monocular-chart-card.component';

describe('MonocularChartCardComponent', () => {
  let component: MonocularChartCardComponent;
  let fixture: ComponentFixture<MonocularChartCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ...BaseTestModulesNoShared,
        HttpClientTestingModule,
        RouterTestingModule,
        MonocularChartCardComponent,
        ChartItemComponent,
        ListItemComponent,
      ],
      providers: [
        EntityServiceFactory,
        { provide: ChartsService, useValue: new MockChartService() },
        ConfigService,
        provideZonelessChangeDetection(),
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MonocularChartCardComponent);
    component = fixture.componentInstance;
    component.row = {
      attributes: {
        repo: {


        },
      },
      relationships: {
        latestChartVersion: {
          data: {

          }
        }
      },
    } as MonocularChart;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
