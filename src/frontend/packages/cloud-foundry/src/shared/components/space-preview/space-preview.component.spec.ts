import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import {
  generateCfBaseTestModules,
  generateTestCfEndpointServiceProvider,
} from '../../../../test-framework/cloud-foundry-endpoint-service.helper';
import {
  CloudFoundryOrganizationService,
} from '../../../features/cloud-foundry/services/cloud-foundry-organization.service';
import { CloudFoundrySpaceService } from '../../../features/cloud-foundry/services/cloud-foundry-space.service';
import { CardCfRecentAppsComponent } from '../cards/card-cf-recent-apps/card-cf-recent-apps.component';
import { CompactAppCardComponent } from '../cards/card-cf-recent-apps/compact-app-card/compact-app-card.component';
import { SpacePreviewComponent } from './space-preview.component';

describe('SpacePreviewComponent', () => {
  let component: SpacePreviewComponent;
  let fixture: ComponentFixture<SpacePreviewComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        SpacePreviewComponent,
        CardCfRecentAppsComponent,
        CompactAppCardComponent
      ],
      providers: [
        ...generateTestCfEndpointServiceProvider(),
        CloudFoundryOrganizationService,
        CloudFoundrySpaceService
      ],
      imports: generateCfBaseTestModules(),
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SpacePreviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
