import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import {
  BaseTestModulesNoShared,
  MetadataCardTestComponents,
} from '../../../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { CfBuildpackCardComponent } from './cf-buildpack-card.component';
import { BooleanIndicatorComponent } from '../../../../boolean-indicator/boolean-indicator.component';
import { EntityMonitorFactory } from '../../../../../monitors/entity-monitor.factory.service';

describe('CfBuildpackCardComponent', () => {
  let component: CfBuildpackCardComponent;
  let fixture: ComponentFixture<CfBuildpackCardComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CfBuildpackCardComponent, ...MetadataCardTestComponents, BooleanIndicatorComponent],
      imports: [...BaseTestModulesNoShared],
      providers: [
        EntityMonitorFactory
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CfBuildpackCardComponent);
    component = fixture.componentInstance;
    component.row = {
      entity: {
        name: '',
        position: 1,
        enabled: true,
        locked: true,
        filename: ''
      },
      metadata: {
        created_at: '',
        updated_at: '',
        guid: '',
        url: ''
      }
    };
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
