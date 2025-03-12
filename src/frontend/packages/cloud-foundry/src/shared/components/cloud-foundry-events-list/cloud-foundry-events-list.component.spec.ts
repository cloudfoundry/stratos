import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ListConfig } from '../../../../../core/src/shared/components/list/list.component.types';
import { CFBaseTestModules } from '../../../../test-framework/cf-test-helper';
import { ActiveRouteCfOrgSpace } from '../../../features/cf/cf-page.types';
import { CloudFoundryEndpointService } from '../../../features/cf/services/cloud-foundry-endpoint.service';
import { CfUserService } from '../../data-services/cf-user.service';
import { CfAllEventsConfigService } from '../list/list-types/cf-events/types/cf-all-events-config.service';
import { CloudFoundryEventsListComponent } from './cloud-foundry-events-list.component';

describe('CloudFoundryEventsListComponent', () => {
  let component: CloudFoundryEventsListComponent;
  let fixture: ComponentFixture<CloudFoundryEventsListComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [
        CloudFoundryEventsListComponent,
      ],
      imports: [...CFBaseTestModules],
      providers: [{
        provide: ListConfig,
        useClass: CfAllEventsConfigService,
      },
        CloudFoundryEndpointService, {
        provide: ActiveRouteCfOrgSpace,
        useValue: {
          cfGuid: 'cfGuid',
          orgGuid: 'orgGuid',
          spaceGuid: 'spaceGuid'
        }
      },
        CfUserService
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CloudFoundryEventsListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
