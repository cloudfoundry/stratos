import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ActivatedRoute } from '@angular/router';
import { StoreModule } from '@ngrx/store';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import {
  EntityMonitorFactory,
  PaginationMonitorFactory,
  EntityServiceFactory,
  appReducers,
  TEST_CATALOGUE_ENTITIES,
  generateStratosEntities,
  EntityCatalogHelper,
  EntityCatalogHelpers,
  EntityCatalogTestModule,
} from '@stratosui/store';
import { STORE_TEST_PROVIDERS, testSCFEndpointGuid } from '@stratosui/store/testing';
import { generateCFEntities, CfUserServiceTestProvider } from '@test-framework/cf';

import { ActiveRouteCfOrgSpace } from '../../../cf-page.types';
import { CloudFoundryReducersModule } from '../../../../../store/cloud-foundry.reducers.module';
import { UserInviteService } from '../../../user-invites/user-invite.service';
import { InviteUsersCreateComponent } from './invite-users-create.component';

describe('InviteUsersCreateComponent', () => {
  let component: InviteUsersCreateComponent;
  let fixture: ComponentFixture<InviteUsersCreateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        InviteUsersCreateComponent,
      ],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideNoopAnimations(),
        ...STORE_TEST_PROVIDERS,
        importProvidersFrom(
          EntityCatalogTestModule,
          CloudFoundryReducersModule,
          StoreModule.forRoot(appReducers, {
            runtimeChecks: { strictStateImmutability: false, strictActionImmutability: false }
          })
        ),
        {
          provide: TEST_CATALOGUE_ENTITIES,
          useValue: [
            ...generateStratosEntities(),
            ...generateCFEntities()
          ]
        },
        EntityServiceFactory,
        EntityMonitorFactory,
        PaginationMonitorFactory,
        EntityCatalogHelper,
        ...CfUserServiceTestProvider,
        UserInviteService,
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParams: {},
              params: {}
            }
          }
        },
        {
          provide: ActiveRouteCfOrgSpace,
          useValue: {
            cfGuid: testSCFEndpointGuid,
            orgGuid: testSCFEndpointGuid,
            spaceGuid: testSCFEndpointGuid
          }
        },
      ]
    })
      .compileComponents();

    // Initialize EntityCatalogHelper for Angular 20 compatibility
    const helper = TestBed.inject(EntityCatalogHelper);
    EntityCatalogHelpers.SetEntityCatalogHelper(helper);
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(InviteUsersCreateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    // Drain the OrgDataService + SpaceDataService HTTP fetches triggered
    // by ngOnInit. The component reads `.name` off the signal so a benign
    // shape is enough; verify() then asserts no unexpected requests.
    const httpMock = TestBed.inject(HttpTestingController);
    httpMock.match(() => true).forEach(req => req.flush({}));
    httpMock.verify();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
