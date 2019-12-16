import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import {
  generateCfBaseTestModules,
  generateTestCfEndpointServiceProvider,
} from '../../../../test-framework/cloud-foundry-endpoint-service.helper';
import {
  CloudFoundryOrganizationService,
} from '../../../features/cloud-foundry/services/cloud-foundry-organization.service';
import { CardCfRecentAppsComponent } from '../cards/card-cf-recent-apps/card-cf-recent-apps.component';
import { CompactAppCardComponent } from '../cards/card-cf-recent-apps/compact-app-card/compact-app-card.component';
import { OrganizationPreviewComponent } from './organization-preview.component';

describe('OrganizationPreviewComponent', () => {
  let component: OrganizationPreviewComponent;
  let fixture: ComponentFixture<OrganizationPreviewComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        OrganizationPreviewComponent,
        CardCfRecentAppsComponent,
        CompactAppCardComponent
      ],
      providers: [
        ...generateTestCfEndpointServiceProvider(),
        CloudFoundryOrganizationService,
      ],
      imports: generateCfBaseTestModules(),
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(OrganizationPreviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
