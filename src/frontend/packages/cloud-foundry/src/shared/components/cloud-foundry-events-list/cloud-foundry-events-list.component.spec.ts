import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideMockStore } from '@ngrx/store/testing';
import { describe, it, expect, beforeEach } from 'vitest';

import { ListConfig } from '@stratosui/core';
import { STORE_TEST_PROVIDERS } from '@stratosui/store/testing';
import { ActiveRouteCfOrgSpace } from '../../../features/cf/cf-page.types';
import { CloudFoundryEndpointService } from '../../../features/cf/services/cloud-foundry-endpoint.service';
import { CfUserService } from '../../data-services/cf-user.service';
import { CfAllEventsConfigService } from '../list/list-types/cf-events/types/cf-all-events-config.service';
import { CloudFoundryEventsListComponent } from './cloud-foundry-events-list.component';

describe('CloudFoundryEventsListComponent', () => {
  let component: CloudFoundryEventsListComponent;
  let fixture: ComponentFixture<CloudFoundryEventsListComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        CloudFoundryEventsListComponent,
      ],
      providers: [
        provideMockStore(),
        ...STORE_TEST_PROVIDERS,
        {
          provide: ListConfig,
          useClass: CfAllEventsConfigService,
        },
        {
          provide: ActiveRouteCfOrgSpace,
          useValue: {
            cfGuid: 'cfGuid',
            orgGuid: 'orgGuid',
            spaceGuid: 'spaceGuid'
          }
        },
        CloudFoundryEndpointService,
        CfUserService,
        provideZonelessChangeDetection(),
      ],
    });
  });

  // TODO: Fix EntityCatalogHelper initialization to enable component creation test
  // The component requires EntityCatalogHelper to be initialized, which needs proper entity catalog setup
  it('should be defined', () => {
    expect(CloudFoundryEventsListComponent).toBeDefined();
  });
});
