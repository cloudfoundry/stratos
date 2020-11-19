import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { PanelComponent } from '../../panel/panel.component';
import { MockChartService } from '../../shared/services/chart.service.mock';
import { ChartsService } from '../../shared/services/charts.service';
import { ChartDetailsVersionsComponent } from './chart-details-versions.component';

describe('ChartDetailsVersionsComponent', () => {
  let component: ChartDetailsVersionsComponent;
  let fixture: ComponentFixture<ChartDetailsVersionsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ChartDetailsVersionsComponent, PanelComponent],
      imports: [RouterTestingModule],
      providers: [{ provide: ChartsService, useValue: new MockChartService() }]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ChartDetailsVersionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
