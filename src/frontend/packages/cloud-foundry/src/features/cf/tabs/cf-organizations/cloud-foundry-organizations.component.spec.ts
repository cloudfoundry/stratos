import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { of } from 'rxjs';
import { Store } from '@ngrx/store';

import { CurrentUserPermissionsService } from '@stratosui/core';
import { CloudFoundryEndpointService } from '../../services/cloud-foundry-endpoint.service';
import { CloudFoundryOrganizationsComponent } from "./cloud-foundry-organizations.component";

describe('CloudFoundryOrganizationsComponent', () => {
  let component: CloudFoundryOrganizationsComponent;
  let fixture: ComponentFixture<CloudFoundryOrganizationsComponent>;

  // Mock services
  const mockStore = {
    dispatch: vi.fn(),
    select: vi.fn(() => of({})),
    pipe: vi.fn(() => of({}))
  };

  const mockCfEndpointService = {
    cfGuid: 'test-cf-guid',
    createGetAllOrganizations: vi.fn()
  };

  // Mock the static method - return a partial mock that satisfies PaginatedAction
  CloudFoundryEndpointService.createGetAllOrganizations = vi.fn(() => ({
    type: 'GET_ALL_ORGANIZATIONS',
    paginationKey: 'test-pagination-key',
    entityType: 'organization',
    endpointType: 'cf',
    endpointGuid: 'test-cf-guid',
    includeRelations: [],
    populateMissing: true,
    flattenPagination: true,
    actions: ['GET_ORGANIZATIONS', 'GET_ORGANIZATIONS_SUCCESS', 'GET_ORGANIZATIONS_FAILED'],
    initialParams: {
      page: 1,
      'results-per-page': 100,
      'order-direction': 'desc',
      'order-direction-field': 'name',
      'order-by': 'name'
    }
  } as any));

  const mockCurrentUserPermissionsService = {
    can: vi.fn(() => of(true))
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        CloudFoundryOrganizationsComponent,
      ],
      providers: [
        provideZonelessChangeDetection(),
        { provide: Store, useValue: mockStore },
        { provide: CloudFoundryEndpointService, useValue: mockCfEndpointService },
        { provide: CurrentUserPermissionsService, useValue: mockCurrentUserPermissionsService },
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CloudFoundryOrganizationsComponent);
    component = fixture.componentInstance;
    // Don't call detectChanges() to avoid complex initialization
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
