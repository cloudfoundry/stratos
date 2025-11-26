import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { of } from 'rxjs';

import { CoreModule } from '@stratosui/core';
import { EntityCatalogTestModule, TEST_CATALOGUE_ENTITIES, generateStratosEntities } from '@stratosui/store';
import { createEmptyStoreModule, STORE_TEST_PROVIDERS } from '@stratosui/store/testing';
import { generateCFEntities } from '../../../../../cf-entity-generator';
import { ActiveRouteCfOrgSpace } from '../../../cf-page.types';
import { UserInviteService } from '../../../user-invites/user-invite.service';
import { CloudFoundryInviteUserLinkComponent } from './cloud-foundry-invite-user-link.component';

describe('CloudFoundryInviteUserLinkComponent', () => {
  let component: CloudFoundryInviteUserLinkComponent;
  let fixture: ComponentFixture<CloudFoundryInviteUserLinkComponent>;

  const mockActiveRoute = {
    cfGuid: 'test-guid',
    orgGuid: 'org-guid',
    spaceGuid: null as string | null
  };

  const mockUserInviteService = {
    canShowInviteUser: vi.fn().mockReturnValue(of(true)),
    configured$: of(true),
    enabled$: of(true),
    canConfigure$: of(true)
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        createEmptyStoreModule(),
        EntityCatalogTestModule,
        CoreModule,
        NoopAnimationsModule,
        CloudFoundryInviteUserLinkComponent,
      ],
      providers: [
        ...STORE_TEST_PROVIDERS,
        {
          provide: TEST_CATALOGUE_ENTITIES,
          useValue: [
            ...generateStratosEntities(),
            ...generateCFEntities()
          ]
        },
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideHttpClient(),
        { provide: ActiveRouteCfOrgSpace, useValue: mockActiveRoute },
        { provide: UserInviteService, useValue: mockUserInviteService },
      ]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CloudFoundryInviteUserLinkComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
