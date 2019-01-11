import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CloudFoundrySpaceService } from '../../../../features/cloud-foundry/services/cloud-foundry-space.service';
import {
  BaseTestModulesNoShared,
  MetadataCardTestComponents,
} from '../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { CloudFoundrySpaceServiceMock } from '../../../../test-framework/cloud-foundry-space.service.mock';
import { EntityMonitorFactory } from '../../../monitors/entity-monitor.factory.service';
import { BooleanIndicatorComponent } from '../../boolean-indicator/boolean-indicator.component';
import { CardCfSpaceDetailsComponent } from './card-cf-space-details.component';

describe('CardCfSpaceDetailsComponent', () => {
  let component: CardCfSpaceDetailsComponent;
  let fixture: ComponentFixture<CardCfSpaceDetailsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CardCfSpaceDetailsComponent, MetadataCardTestComponents, BooleanIndicatorComponent],
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
