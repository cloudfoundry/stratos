import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import {
  BooleanIndicatorComponent,
} from '../../../../../../core/src/shared/components/boolean-indicator/boolean-indicator.component';
import { MetadataItemComponent } from '../../../../../../core/src/shared/components/metadata-item/metadata-item.component';
import { EntityMonitorFactory } from '../../../../../../core/src/shared/monitors/entity-monitor.factory.service';
import { BaseTestModulesNoShared } from '../../../../../../core/test-framework/cloud-foundry-endpoint-service.helper';
import { CloudFoundrySpaceServiceMock } from '../../../../../../core/test-framework/cloud-foundry-space.service.mock';
import { CloudFoundrySpaceService } from '../../../../features/cloud-foundry/services/cloud-foundry-space.service';
import { CardCfSpaceDetailsComponent } from './card-cf-space-details.component';

describe('CardCfSpaceDetailsComponent', () => {
  let component: CardCfSpaceDetailsComponent;
  let fixture: ComponentFixture<CardCfSpaceDetailsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CardCfSpaceDetailsComponent, MetadataItemComponent, BooleanIndicatorComponent],
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
