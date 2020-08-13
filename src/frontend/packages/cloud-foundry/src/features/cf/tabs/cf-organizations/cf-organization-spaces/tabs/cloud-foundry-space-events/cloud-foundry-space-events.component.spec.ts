import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import {
  generateActiveRouteCfOrgSpaceMock,
} from 'frontend/packages/cloud-foundry/test-framework/cloud-foundry-endpoint-service.helper';

import { ListConfig } from '../../../../../../../../../core/src/shared/components/list/list.component.types';
import { CFBaseTestModules } from '../../../../../../../../test-framework/cf-test-helper';
import {
  CloudFoundryEventsListComponent,
} from '../../../../../../../shared/components/cloud-foundry-events-list/cloud-foundry-events-list.component';
import {
  CfSpaceEventsConfigService,
} from '../../../../../../../shared/components/list/list-types/cf-events/types/cf-space-events-config.service';
import { CfUserService } from '../../../../../../../shared/data-services/cf-user.service';
import {
  CloudFoundryUserProvidedServicesService,
} from '../../../../../../../shared/services/cloud-foundry-user-provided-services.service';
import { CloudFoundryEndpointService } from '../../../../../services/cloud-foundry-endpoint.service';
import { CloudFoundryOrganizationService } from '../../../../../services/cloud-foundry-organization.service';
import { CloudFoundrySpaceService } from '../../../../../services/cloud-foundry-space.service';
import { CloudFoundrySpaceEventsComponent } from './cloud-foundry-space-events.component';

describe('CloudFoundrySpaceEventsComponent', () => {
  let component: CloudFoundrySpaceEventsComponent;
  let fixture: ComponentFixture<CloudFoundrySpaceEventsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        CloudFoundrySpaceEventsComponent,
        CloudFoundryEventsListComponent
      ],
      providers: [
        {
          provide: ListConfig,
          useClass: CfSpaceEventsConfigService,
        },
        generateActiveRouteCfOrgSpaceMock(),
        CloudFoundrySpaceService,
        CfUserService,
        CloudFoundryEndpointService,
        CloudFoundryOrganizationService,
        CloudFoundryUserProvidedServicesService
      ],
      imports: [...CFBaseTestModules]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CloudFoundrySpaceEventsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
