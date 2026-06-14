import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ActivatedRoute } from '@angular/router';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { of, firstValueFrom } from 'rxjs';

import { TEST_CATALOGUE_ENTITIES, generateStratosEntities, EntityCatalogHelper, EntityCatalogHelpers, EntityCatalogTestModule } from '@stratosui/store';
import { STORE_TEST_PROVIDERS, testSCFEndpointGuid } from '@stratosui/store/testing';
import { generateCFEntities, CfUserServiceTestProvider } from '@test-framework/cf';

import { ActiveRouteCfOrgSpace } from '../../../cf-page.types';
import { CloudFoundryReducersModule } from '../../../../../store/cloud-foundry.reducers.module';
import { UserInviteService } from '../../../user-invites/user-invite.service';
import { CfUsersPagedDataService } from '../../../../../shared/data-services/cf-users-paged-data.service';
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
          CloudFoundryReducersModule
        ),
        {
          provide: TEST_CATALOGUE_ENTITIES,
          useValue: [
            ...generateStratosEntities(),
            ...generateCFEntities()
          ]
        },
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

  it('marks the signal-native user cache stale for the active cfGuid on a fully successful invite', async () => {
    const usersData = TestBed.inject(CfUsersPagedDataService);
    const markStale = vi.spyOn(usersData, 'markStale');

    const inviteService = TestBed.inject(UserInviteService);
    vi.spyOn(inviteService, 'invite').mockReturnValue(of({
      error: false,
      failed_invites: [],
      new_invites: [],
    }));

    // Populate the component's pending users so runInvite() iterates a value.
    component.stateOut({
      valid: true,
      values: { row0: 'someone@example.com' },
    } as any);

    // Drive the same code path the wizard uses on submit.
    // strict: onNext's impl ignores the stepper's (index, step) contract
    // args; call it via its real runtime shape.
    await firstValueFrom((component.onNext as () => ReturnType<typeof component.onNext>)());

    expect(markStale).toHaveBeenCalledWith(testSCFEndpointGuid);
  });
});
