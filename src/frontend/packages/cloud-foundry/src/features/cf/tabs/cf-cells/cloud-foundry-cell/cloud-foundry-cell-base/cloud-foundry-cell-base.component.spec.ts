import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TabNavService } from '../../../../../../../../core/src/tab-nav.service';
import { generateCfBaseTestModules } from '../../../../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { CfUserService } from '../../../../../../shared/data-services/cf-user.service';
import { ActiveRouteCfOrgSpace } from '../../../../cf-page.types';
import { CloudFoundryEndpointService } from '../../../../services/cloud-foundry-endpoint.service';
import { CloudFoundryCellTabService } from '../cloud-foundry-cell-tab.service';
import { CloudFoundryCellBaseComponent } from './cloud-foundry-cell-base.component';

describe('CloudFoundryCellBaseComponent', () => {
  let component: CloudFoundryCellBaseComponent;
  let fixture: ComponentFixture<CloudFoundryCellBaseComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CloudFoundryCellBaseComponent],
      imports: generateCfBaseTestModules(),
      providers: [
        CloudFoundryEndpointService,
        CloudFoundryCellTabService, {
          provide: ActiveRouteCfOrgSpace,
          useValue: {
            cfGuid: 'cfGuid',
            orgGuid: 'orgGuid',
            spaceGuid: 'spaceGuid'
          }
        },
        TabNavService,
        CfUserService
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CloudFoundryCellBaseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
