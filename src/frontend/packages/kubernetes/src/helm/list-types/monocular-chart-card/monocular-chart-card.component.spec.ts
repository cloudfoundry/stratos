import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';

import { BaseTestModulesNoShared } from '../../../../../core/test-framework/core-test.helper';
import { ChartItemComponent } from '../../monocular/chart-item/chart-item.component';
import { ListItemComponent } from '../../monocular/list-item/list-item.component';
import { ChartsService } from '../../monocular/shared/services/charts.service';
import { ConfigService } from '../../monocular/shared/services/config.service';
import { MonocularChart } from '../../store/helm.types';
import { MonocularChartCardComponent } from './monocular-chart-card.component';

describe('MonocularChartCardComponent', () => {
  let component: MonocularChartCardComponent;
  let fixture: ComponentFixture<MonocularChartCardComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        ...BaseTestModulesNoShared,
        MonocularChartCardComponent,
        ChartItemComponent,
        ListItemComponent
      ],
      providers: [
        
        ChartsService,
        ConfigService
      ,
        provideZonelessChangeDetection()
      ]
    })
      .compileComponents();
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
