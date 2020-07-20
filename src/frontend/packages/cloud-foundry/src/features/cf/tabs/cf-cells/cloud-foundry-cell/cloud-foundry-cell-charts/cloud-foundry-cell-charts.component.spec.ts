import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { generateCfBaseTestModules } from '../../../../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { ActiveRouteCfCell } from '../../../../cf-page.types';
import { CloudFoundryCellService } from '../cloud-foundry-cell.service';
import { CloudFoundryCellChartsComponent } from './cloud-foundry-cell-charts.component';

describe('CloudFoundryCellChartsComponent', () => {
  let component: CloudFoundryCellChartsComponent;
  let fixture: ComponentFixture<CloudFoundryCellChartsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        CloudFoundryCellChartsComponent,
      ],
      imports: generateCfBaseTestModules(),
      providers: [
        CloudFoundryCellService,
        ActiveRouteCfCell
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CloudFoundryCellChartsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
