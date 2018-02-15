import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import {
  generateTestCfEndpointServiceProvider,
  getBaseTestModulesNoShared,
  generateTestCfEndpointService
} from '../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { CfOrgSpaceDataService } from '../../../data-services/cf-org-space-service.service';
import { EntityMonitorFactory } from '../../../monitors/entity-monitor.factory.service';
import { MetadataItemComponent } from '../../metadata-item/metadata-item.component';
import { CardCfInfoComponent } from './card-cf-info.component';
import { PaginationMonitorFactory } from '../../../monitors/pagination-monitor.factory';
import { CfUserService } from '../../../data-services/cf-user.service';

describe('CardCfInfoComponent', () => {
  let component: CardCfInfoComponent;
  let fixture: ComponentFixture<CardCfInfoComponent>;
  beforeEach(
    async(() => {
      TestBed.configureTestingModule({
        declarations: [CardCfInfoComponent, MetadataItemComponent],
        imports: [...getBaseTestModulesNoShared],
        providers: [generateTestCfEndpointService()]
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(CardCfInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
