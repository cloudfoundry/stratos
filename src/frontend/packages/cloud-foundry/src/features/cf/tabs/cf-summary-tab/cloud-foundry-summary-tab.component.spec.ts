import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TabNavService } from '../../../../../../core/src/tab-nav.service';
import {
  generateCfBaseTestModules,
  generateTestCfEndpointServiceProvider,
} from '../../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { CardCfInfoComponent } from '../../../../shared/components/cards/card-cf-info/card-cf-info.component';
import { CardCfRecentAppsComponent } from '../../../home/card-cf-recent-apps/card-cf-recent-apps.component';
import { CompactAppCardComponent } from '../../../home/card-cf-recent-apps/compact-app-card/compact-app-card.component';
import { CloudFoundrySummaryTabComponent } from './cloud-foundry-summary-tab.component';

describe('CloudFoundrySummaryTabComponent', () => {
  let component: CloudFoundrySummaryTabComponent;
  let fixture: ComponentFixture<CloudFoundrySummaryTabComponent>;
  beforeEach(
    async(() => {
      TestBed.configureTestingModule({
        declarations: [
          CloudFoundrySummaryTabComponent,
          CardCfInfoComponent,
          CardCfRecentAppsComponent,
          CompactAppCardComponent
        ],
        imports: generateCfBaseTestModules(),
        providers: [
          ...generateTestCfEndpointServiceProvider(),
          TabNavService
        ]
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(CloudFoundrySummaryTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

