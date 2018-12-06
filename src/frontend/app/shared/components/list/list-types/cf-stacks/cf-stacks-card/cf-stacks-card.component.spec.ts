import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import {
  BaseTestModulesNoShared,
  MetadataCardTestComponents,
} from '../../../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { CfStacksCardComponent } from './cf-stacks-card.component';
import { EntityMonitorFactory } from '../../../../../monitors/entity-monitor.factory.service';

describe('CfStacksCardComponent', () => {
  let component: CfStacksCardComponent;
  let fixture: ComponentFixture<CfStacksCardComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CfStacksCardComponent, MetadataCardTestComponents],
      imports: [...BaseTestModulesNoShared],
      providers: [
        EntityMonitorFactory
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CfStacksCardComponent);
    component = fixture.componentInstance;
    component.row = {
      entity: {
        name: '',
        description: ''
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
