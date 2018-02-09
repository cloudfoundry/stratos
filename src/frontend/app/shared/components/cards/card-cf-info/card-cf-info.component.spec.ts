import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CardCfInfoComponent } from './card-cf-info.component';
import {
  getBaseTestModules,
  generateTestCfEndpointServiceProvider,
  getBaseTestModulesNoShared
} from '../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { MetadataItemComponent } from '../../metadata-item/metadata-item.component';
import { EntityMonitorFactory } from '../../../monitors/entity-monitor.factory.service';

describe('CardCfInfoComponent', () => {
  let component: CardCfInfoComponent;
  let fixture: ComponentFixture<CardCfInfoComponent>;
  const cfId = '1';
  beforeEach(
    async(() => {
      TestBed.configureTestingModule({
        declarations: [CardCfInfoComponent, MetadataItemComponent],
        imports: [...getBaseTestModulesNoShared],
        providers: [
          generateTestCfEndpointServiceProvider(cfId),
          EntityMonitorFactory
        ]
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
