import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';

import { STORE_TEST_PROVIDERS, createBasicStoreModule, AppTestModule, CoreTestingModule } from '@test-framework';
import { CurrentUserPermissionsService } from '@stratosui/core';
import { UserProfileService } from '@stratosui/core';
import { TabNavService } from '@stratosui/core';
import { NoEndpointsNonAdminComponent } from './no-endpoints-non-admin.component';

describe('NoEndpointsNonAdminComponent', () => {
  let component: NoEndpointsNonAdminComponent;
  let fixture: ComponentFixture<NoEndpointsNonAdminComponent>;

  // Mock UserProfileService to avoid entity catalog issues
  const mockUserProfileService = {
    userProfile$: of({
      id: 'test-user',
      name: {
        familyName: 'User',
        givenName: 'Test'
      },
      userName: 'test-user',
      emails: [{
        primary: true,
        value: 'test@test.com'
      }],
      meta: {
        version: 1,
        created: '',
        lastModified: ''
      },
      verified: true,
      active: true,
      passwordLastModified: '',
      schemas: '',
      zoneId: '',
      origin: ''
    }),
    isFetching$: of(false),
    isError$: of(false),
    fetchUserProfile: vi.fn(),
    getPrimaryEmailAddress: vi.fn().mockReturnValue('test@test.com'),
    setPrimaryEmailAddress: vi.fn(),
    updateProfile: vi.fn().mockReturnValue(of([{}, {}]))
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        RouterTestingModule,
        CoreTestingModule,
        createBasicStoreModule(),
        AppTestModule,
        NoEndpointsNonAdminComponent,
      ],
      providers: [
        ...STORE_TEST_PROVIDERS,
        { provide: UserProfileService, useValue: mockUserProfileService },
        TabNavService,
        CurrentUserPermissionsService,
        provideZonelessChangeDetection(),
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(NoEndpointsNonAdminComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
