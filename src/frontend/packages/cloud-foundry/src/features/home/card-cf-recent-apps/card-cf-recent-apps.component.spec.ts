import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { of as observableOf } from 'rxjs';

import {
  ApplicationStateIconComponent,
} from '../../../../../core/src/shared/components/application-state/application-state-icon/application-state-icon.component';
import {
  ApplicationStateIconPipe,
} from '../../../../../core/src/shared/components/application-state/application-state-icon/application-state-icon.pipe';
import {
  PollingIndicatorComponent,
} from '../../../../../core/src/shared/components/polling-indicator/polling-indicator.component';
import { EntityMonitorFactory } from '../../../../../store/src/monitors/entity-monitor.factory.service';
import { PaginationMonitorFactory } from '../../../../../store/src/monitors/pagination-monitor.factory';
import {
  generateActiveRouteCfOrgSpaceMock,
  generateCfBaseTestModulesNoShared,
} from '../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { CfUserService } from '../../../shared/data-services/cf-user.service';
import { CloudFoundryEndpointService } from '../../cf/services/cloud-foundry-endpoint.service';
import { CardCfRecentAppsComponent } from './card-cf-recent-apps.component';
import { CompactAppCardComponent } from './compact-app-card/compact-app-card.component';

describe('CardCfRecentAppsComponent', () => {
  let component: CardCfRecentAppsComponent;
  let fixture: ComponentFixture<CardCfRecentAppsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        CardCfRecentAppsComponent,
        ApplicationStateIconComponent,
        CompactAppCardComponent,
        PollingIndicatorComponent,
        ApplicationStateIconPipe
      ],
      imports: generateCfBaseTestModulesNoShared(),
      providers: [
        generateActiveRouteCfOrgSpaceMock(),
        CloudFoundryEndpointService,
        EntityMonitorFactory,
        CfUserService,
        PaginationMonitorFactory
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CardCfRecentAppsComponent);
    component = fixture.componentInstance;
    component.allApps$ = observableOf([]);

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
