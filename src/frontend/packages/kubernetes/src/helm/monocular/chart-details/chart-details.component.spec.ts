import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach } from 'vitest';
import { ActivatedRoute } from '@angular/router';

import { EntitySummaryTitleComponent } from '@stratosui/core';
import { BaseTestModulesNoShared } from '../../../../../core/test-framework/core-test.helper';
import { STORE_TEST_PROVIDERS } from '@stratosui/store/testing';
import { EntityServiceFactory, PaginationMonitorFactory } from '@stratosui/store';
import { HelmTestingModule } from '../../helm-testing.module';
import { ChartItemComponent } from '../chart-item/chart-item.component';
import { ListItemComponent } from '../list-item/list-item.component';
import { LoaderComponent } from '../loader/loader.component';
import { PanelComponent } from '../panel/panel.component';
import { MockChartService } from '../shared/services/chart.service.mock';
import { ChartsService } from '../shared/services/charts.service';
import { ConfigService } from '../shared/services/config.service';
import { MenuService } from '../shared/services/menu.service';
import { ChartDetailsInfoComponent } from './chart-details-info/chart-details-info.component';
import { ChartDetailsReadmeComponent } from './chart-details-readme/chart-details-readme.component';
import { ChartDetailsUsageComponent } from './chart-details-usage/chart-details-usage.component';
import { ChartDetailsVersionsComponent } from './chart-details-versions/chart-details-versions.component';
import { ChartDetailsComponent } from './chart-details.component';

describe('ChartDetailsComponent', () => {
  let component: ChartDetailsComponent;
  let fixture: ComponentFixture<ChartDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ...BaseTestModulesNoShared,
        HelmTestingModule,
        ChartDetailsComponent,
        ChartDetailsVersionsComponent,
        ChartDetailsInfoComponent,
        ChartDetailsReadmeComponent,
        ChartDetailsUsageComponent,
        LoaderComponent,
        PanelComponent,
        ChartItemComponent,
        ListItemComponent,
        EntitySummaryTitleComponent,
      ],
      providers: [
        ...STORE_TEST_PROVIDERS,
        { provide: ChartsService, useValue: new MockChartService() },
        { provide: ConfigService, useValue: { appName: 'appName' } },
        { provide: MenuService },
        { provide: ActivatedRoute, useValue: {
          params: {
            forEach: (fn: any) => fn({}),
            subscribe: () => {}
          },
          snapshot: { params: {}, queryParams: {} }
        }},
        EntityServiceFactory,
        PaginationMonitorFactory,
        provideZonelessChangeDetection()
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ChartDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
