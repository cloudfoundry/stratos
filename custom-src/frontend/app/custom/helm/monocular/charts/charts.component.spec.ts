import { HttpClient } from '@angular/common/http';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';

import { createBasicStoreModule } from '../../../../../../store/testing/public-api';
import { LoggerService } from '../../../../core/logger.service';
import { ChartItemComponent } from '../chart-item/chart-item.component';
import { ChartListComponent } from '../chart-list/chart-list.component';
import { LoaderComponent } from '../loader/loader.component';
import { PanelComponent } from '../panel/panel.component';
import { MockChartService } from '../shared/services/chart.service.mock';
import { ChartsService } from '../shared/services/charts.service';
import { ConfigService } from '../shared/services/config.service';
import { MenuService } from '../shared/services/menu.service';
import { ReposService } from '../shared/services/repos.service';
import { ChartsComponent } from './charts.component';

// import { HeaderBarComponent } from '../header-bar/header-bar.component';
// import { SeoService } from '../shared/services/seo.service';
describe('Component: Charts', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        createBasicStoreModule()
      ],
      declarations: [
        ChartsComponent,
        ChartListComponent,
        ChartItemComponent,
        LoaderComponent,
        PanelComponent,
        // HeaderBarComponent
      ],
      providers: [
        HttpClient,
        ConfigService,
        MenuService,
        { provide: ChartsService, useValue: new MockChartService() },
        // { provide: SeoService },
        { provide: ActivatedRoute },
        { provide: Router },
        ReposService,
        LoggerService
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  });

  it('should create an instance', () => {
    const component = TestBed.createComponent(ChartsComponent);
    expect(component).toBeTruthy();
  });
});
