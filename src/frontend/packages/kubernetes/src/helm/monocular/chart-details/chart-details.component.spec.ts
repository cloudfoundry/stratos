import { HttpClient, HttpClientModule } from '@angular/common/http';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { BrowserModule } from '@angular/platform-browser';
import { RouterTestingModule } from '@angular/router/testing';

import {
  EntitySummaryTitleComponent,
} from '../../../../../core/src/shared/components/entity-summary-title/entity-summary-title.component';
import { BaseTestModulesNoShared } from '../../../../../core/test-framework/core-test.helper';
import { PaginationMonitorFactory } from '../../../../../store/src/monitors/pagination-monitor.factory';
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

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        imports: [
          BrowserModule,
          RouterTestingModule,
          HttpClientModule,
          ...BaseTestModulesNoShared
        ],
        declarations: [
          ChartDetailsComponent,
          ChartDetailsVersionsComponent,
          ChartDetailsInfoComponent,
          ChartDetailsReadmeComponent,
          ChartDetailsUsageComponent,
          LoaderComponent,
          PanelComponent,
          ChartItemComponent,
          ListItemComponent,
          EntitySummaryTitleComponent
        ],
        providers: [
          HttpClient,
          { provide: ChartsService, useValue: new MockChartService() },
          { provide: ConfigService, useValue: { appName: 'appName' } },
          { provide: MenuService },
          PaginationMonitorFactory,
        ]
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(ChartDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
