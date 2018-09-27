import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BaseTestModules } from '../../../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { ActiveRouteCfOrgSpace } from '../../../../cf-page.types';
import { CloudFoundryCellChartsComponent } from './cloud-foundry-cell-charts.component';

describe('CloudFoundryCellChartsComponent', () => {
  let component: CloudFoundryCellChartsComponent;
  let fixture: ComponentFixture<CloudFoundryCellChartsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CloudFoundryCellChartsComponent],
      imports: [...BaseTestModules],
      providers: [ActiveRouteCfOrgSpace]
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
