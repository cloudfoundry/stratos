import { HttpClient } from '@angular/common/http';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';

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

describe('ChartsComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        createBasicStoreModule(),
        RouterTestingModule
      ],
      declarations: [
        ChartsComponent,
        ChartListComponent,
        ChartItemComponent,
        LoaderComponent,
        PanelComponent,
      ],
      providers: [
        HttpClient,
        ConfigService,
        MenuService,
        { provide: ChartsService, useValue: new MockChartService() },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              params: {},
              queryParams: {}
            },
            queryParams: of({}),
            params: of({})
          }
        },
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
