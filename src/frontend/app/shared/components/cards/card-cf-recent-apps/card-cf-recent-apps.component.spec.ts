import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BaseTestModulesNoShared } from '../../../../test-framework/cloud-foundry-endpoint-service.helper';
import {
  ApplicationStateIconComponent,
} from '../../application-state/application-state-icon/application-state-icon.component';
import { ApplicationStateIconPipe } from '../../application-state/application-state-icon/application-state-icon.pipe';
import { CardCfRecentAppsComponent } from './card-cf-recent-apps.component';
import { CompactAppCardComponent } from './compact-app-card/compact-app-card.component';
import { CloudFoundryEndpointService } from '../../../../features/cloud-foundry/services/cloud-foundry-endpoint.service';
import { ActiveRouteCfOrgSpace } from '../../../../features/cloud-foundry/cf-page.types';
import { EntityMonitorFactory } from '../../../monitors/entity-monitor.factory.service';
import { CfUserService } from '../../../data-services/cf-user.service';
import { PaginationMonitorFactory } from '../../../monitors/pagination-monitor.factory';

describe('CardCfRecentAppsComponent', () => {
  let component: CardCfRecentAppsComponent;
  let fixture: ComponentFixture<CardCfRecentAppsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        CardCfRecentAppsComponent,
        ApplicationStateIconComponent,
        CompactAppCardComponent,
        ApplicationStateIconPipe
      ],
      imports: [...BaseTestModulesNoShared],
      providers: [
        CloudFoundryEndpointService,
        ActiveRouteCfOrgSpace,
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
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
