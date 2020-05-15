import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CFBaseTestModules } from '../../../../../test-framework/cf-test-helper';
import {
  CloudFoundryEventsListComponent,
} from '../../../../shared/components/cloud-foundry-events-list/cloud-foundry-events-list.component';
import { CfUserService } from '../../../../shared/data-services/cf-user.service';
import { ActiveRouteCfOrgSpace } from '../../cf-page.types';
import { CloudFoundryEndpointService } from '../../services/cloud-foundry-endpoint.service';
import { CloudFoundryEventsComponent } from './cloud-foundry-events.component';

describe('CloudFoundryEventsComponent', () => {
  let component: CloudFoundryEventsComponent;
  let fixture: ComponentFixture<CloudFoundryEventsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        CloudFoundryEventsComponent,
        CloudFoundryEventsListComponent

      ],
      imports: [...CFBaseTestModules],
      providers: [
        CloudFoundryEndpointService,
        CfUserService, {
          provide: ActiveRouteCfOrgSpace,
          useValue: {
            cfGuid: 'cfGuid',
            orgGuid: 'orgGuid',
            spaceGuid: 'spaceGuid'
          }
        }
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CloudFoundryEventsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
