import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { Store } from '@ngrx/store';
import { testSessionData } from '@stratosui/store/testing';

import { ConfirmationDialogService } from '../../../../../../../../core/src/shared/components/confirmation-dialog.service';
import { MetadataCardTestComponents } from '../../../../../../../../core/test-framework/core-test.helper';
import { VerifiedSession } from '../../../../../../../../store/src/actions/auth.actions';
import { EntityServiceFactory } from '../../../../../../../../store/src/entity-service-factory.service';
import { EntityMonitorFactory } from '../../../../../../../../store/src/monitors/entity-monitor.factory.service';
import { PaginationMonitorFactory } from '../../../../../../../../store/src/monitors/pagination-monitor.factory';
import {
  generateCfBaseTestModulesNoShared,
  generateTestCfEndpointServiceProvider,
  generateTestCfUserServiceProvider,
} from '../../../../../../../test-framework/cloud-foundry-endpoint-service.helper';
import {
  CloudFoundryOrganizationService,
} from '../../../../../../features/cloud-foundry/services/cloud-foundry-organization.service';
import { CfOrgSpaceDataService } from '../../../../../data-services/cf-org-space-service.service';
import {
  CloudFoundryUserProvidedServicesService,
} from '../../../../../services/cloud-foundry-user-provided-services.service';
import { CfSpaceCardComponent } from './cf-space-card.component';

describe('CfSpaceCardComponent', () => {
  let component: CfSpaceCardComponent;
  let fixture: ComponentFixture<CfSpaceCardComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        CfSpaceCardComponent,
        ...MetadataCardTestComponents
      ],
      imports: generateCfBaseTestModulesNoShared(),
      providers: [
        PaginationMonitorFactory,
        EntityMonitorFactory,
        generateTestCfUserServiceProvider(),
        CfOrgSpaceDataService,
        CloudFoundryOrganizationService,
        generateTestCfEndpointServiceProvider(),
        EntityServiceFactory,
        ConfirmationDialogService,
        CloudFoundryUserProvidedServicesService
      ]
    })
      .compileComponents();

    const store = TestBed.get(Store);
    store.dispatch(new VerifiedSession(testSessionData));
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CfSpaceCardComponent);
    component = fixture.componentInstance;
    component.row = {
      metadata: {
        guid: 'd87ba175-51ec-4cc9-916c-bee26d00e498',
        url: '/v2/spaces/d87ba175-51ec-4cc9-916c-bee26d00e498',
        created_at: '2017-10-10T09:28:48Z',
        updated_at: '2017-10-10T09:28:48Z'
      },
      entity: {
        name: 'dev',
        organization_guid: 'a63027a8-e160-4e71-ad59-6675aa94a886',
        space_quota_definition_guid: null,
        isolation_segment_guid: null,
        allow_ssh: true,
        organization_url: '/v2/organizations/a63027a8-e160-4e71-ad59-6675aa94a886',
        developers_url: '/v2/spaces/d87ba175-51ec-4cc9-916c-bee26d00e498/developers',
        managers_url: '/v2/spaces/d87ba175-51ec-4cc9-916c-bee26d00e498/managers',
        auditors_url: '/v2/spaces/d87ba175-51ec-4cc9-916c-bee26d00e498/auditors',
        apps_url: '/v2/spaces/d87ba175-51ec-4cc9-916c-bee26d00e498/apps',
        routes_url: '/v2/spaces/d87ba175-51ec-4cc9-916c-bee26d00e498/routes',
        domains_url: '/v2/spaces/d87ba175-51ec-4cc9-916c-bee26d00e498/domains',
        service_instances_url: '/v2/spaces/d87ba175-51ec-4cc9-916c-bee26d00e498/service_instances',
        app_events_url: '/v2/spaces/d87ba175-51ec-4cc9-916c-bee26d00e498/app_events',
        events_url: '/v2/spaces/d87ba175-51ec-4cc9-916c-bee26d00e498/events',
        security_groups_url: '/v2/spaces/d87ba175-51ec-4cc9-916c-bee26d00e498/security_groups',
        staging_security_groups_url: '/v2/spaces/d87ba175-51ec-4cc9-916c-bee26d00e498/staging_security_groups'
      }
    };
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
