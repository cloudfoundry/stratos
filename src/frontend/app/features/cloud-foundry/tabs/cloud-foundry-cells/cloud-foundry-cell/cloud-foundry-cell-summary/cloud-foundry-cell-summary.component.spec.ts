import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CloudFoundryCellSummaryComponent } from './cloud-foundry-cell-summary.component';
import { BaseTestModules } from '../../../../../../test-framework/cloud-foundry-endpoint-service.helper';

describe('CloudFoundryCellSummaryComponent', () => {
  let component: CloudFoundryCellSummaryComponent;
  let fixture: ComponentFixture<CloudFoundryCellSummaryComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CloudFoundryCellSummaryComponent],
      imports: [...BaseTestModules],
      providers: [ActiveRouteCfOrgSpace]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CloudFoundryCellSummaryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
