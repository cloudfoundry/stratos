import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { HelmBaseTestModules } from '../../helm-testing.module';
import { MockChartService } from '../../monocular/shared/services/chart.service.mock';
import { ChartsService } from '../../monocular/shared/services/charts.service';
import { CatalogTabComponent } from './catalog-tab.component';

describe('CatalogTabComponent', () => {
  let component: CatalogTabComponent;
  let fixture: ComponentFixture<CatalogTabComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        ...HelmBaseTestModules
      ],
      declarations: [CatalogTabComponent],
      providers: [{ provide: ChartsService, useValue: new MockChartService() }]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CatalogTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
