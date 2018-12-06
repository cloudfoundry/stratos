import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CloudFoundrySpaceService } from '../../../../features/cloud-foundry/services/cloud-foundry-space.service';
import {
  BaseTestModulesNoShared,
  MetadataCardTestComponents,
} from '../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { CloudFoundrySpaceServiceMock } from '../../../../test-framework/cloud-foundry-space.service.mock';
import { CardCfSpaceDetailsComponent } from './card-cf-space-details.component';
import { EntityMonitorFactory } from '../../../monitors/entity-monitor.factory.service';

describe('CardCfSpaceDetailsComponent', () => {
  let component: CardCfSpaceDetailsComponent;
  let fixture: ComponentFixture<CardCfSpaceDetailsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CardCfSpaceDetailsComponent, MetadataCardTestComponents],
      imports: [...BaseTestModulesNoShared],
      providers: [
        { provide: CloudFoundrySpaceService, useClass: CloudFoundrySpaceServiceMock },
        EntityMonitorFactory
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CardCfSpaceDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
