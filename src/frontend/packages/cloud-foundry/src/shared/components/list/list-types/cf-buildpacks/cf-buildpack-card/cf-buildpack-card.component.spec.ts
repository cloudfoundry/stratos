import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import {
  BooleanIndicatorComponent,
} from '../../../../../../../../core/src/shared/components/boolean-indicator/boolean-indicator.component';
import { EntityMonitorFactory } from '../../../../../../../../store/src/monitors/entity-monitor.factory.service';
import { MetadataCardTestComponents } from '../../../../../../../../core/test-framework/core-test.helper';
import {
  generateCfBaseTestModulesNoShared,
} from '../../../../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { CfBuildpackCardComponent } from './cf-buildpack-card.component';

describe('CfBuildpackCardComponent', () => {
  let component: CfBuildpackCardComponent;
  let fixture: ComponentFixture<CfBuildpackCardComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [CfBuildpackCardComponent, ...MetadataCardTestComponents, BooleanIndicatorComponent],
      imports: generateCfBaseTestModulesNoShared(),
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
