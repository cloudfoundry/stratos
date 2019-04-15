import { NO_ERRORS_SCHEMA } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';

import { ChartItemComponent } from '../chart-item/chart-item.component';
import { ChartListComponent } from '../chart-list/chart-list.component';
import { LoaderComponent } from '../loader/loader.component';
import { PanelComponent } from '../panel/panel.component';
import { ChartsService } from '../shared/services/charts.service';
import { ConfigService } from '../shared/services/config.service';
import { MenuService } from '../shared/services/menu.service';
import { ChartsComponent } from './charts.component';

// import { HeaderBarComponent } from '../header-bar/header-bar.component';
// import { SeoService } from '../shared/services/seo.service';
describe('Component: Charts', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [],
      declarations: [
        ChartsComponent,
        ChartListComponent,
        ChartItemComponent,
        LoaderComponent,
        PanelComponent,
        // HeaderBarComponent
      ],
      providers: [
        ConfigService,
        MenuService,
        { provide: ChartsService },
        // { provide: SeoService },
        { provide: ActivatedRoute },
        { provide: Router }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  });

  it('should create an instance', () => {
    const component = TestBed.createComponent(ChartsComponent);
    expect(component).toBeTruthy();
  });
});
