import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BaseTestModules } from '../../../../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { CloudFoundrySpaceServiceMock } from '../../../../../../../test-framework/cloud-foundry-space.service.mock';
import { CloudFoundrySpaceService } from '../../../../../services/cloud-foundry-space.service';
import { CloudFoundrySpaceSummaryComponent } from './cloud-foundry-space-summary.component';
import { CloudFoundryEndpointService } from '../../../../../services/cloud-foundry-endpoint.service';
import { ActiveRouteCfOrgSpace } from '../../../../../cf-page.types';

describe('CloudFoundrySpaceSummaryComponent', () => {
  let component: CloudFoundrySpaceSummaryComponent;
  let fixture: ComponentFixture<CloudFoundrySpaceSummaryComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CloudFoundrySpaceSummaryComponent],
      imports: [...BaseTestModules],
      providers: [
        ActiveRouteCfOrgSpace,
        CloudFoundryEndpointService,
        { provide: CloudFoundrySpaceService, useClass: CloudFoundrySpaceServiceMock }
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CloudFoundrySpaceSummaryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
