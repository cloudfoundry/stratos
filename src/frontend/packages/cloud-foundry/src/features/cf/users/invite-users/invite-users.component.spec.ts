import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach } from 'vitest';

import { InviteUsersComponent } from './invite-users.component';
import { ActiveRouteCfOrgSpace } from '../../cf-page.types';

describe('InviteUsersComponent', () => {
  let component: InviteUsersComponent;

  function createComponent(mock: ActiveRouteCfOrgSpace): InviteUsersComponent {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: ActiveRouteCfOrgSpace, useValue: mock },
      ],
    });
    return TestBed.runInInjectionContext(() => new InviteUsersComponent());
  }

  beforeEach(() => {
    component = createComponent({
      cfGuid: 'test-cf-guid',
      orgGuid: 'test-org-guid',
      spaceGuid: 'test-space-guid',
    });
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should set defaultCancelUrl correctly for space level', () => {
    component = createComponent({
      cfGuid: 'cf-123',
      orgGuid: 'org-456',
      spaceGuid: 'space-789',
    });

    expect(component.defaultCancelUrl).toBe('/cloud-foundry/cf-123/organizations/org-456/spaces/space-789/users');
  });

  it('should set defaultCancelUrl correctly for org level', () => {
    component = createComponent({
      cfGuid: 'cf-123',
      orgGuid: 'org-456',
      spaceGuid: '',
    });

    expect(component.defaultCancelUrl).toBe('/cloud-foundry/cf-123/organizations/org-456/users');
  });

  it('should set defaultCancelUrl correctly for cf level', () => {
    component = createComponent({
      cfGuid: 'cf-123',
      orgGuid: '',
      spaceGuid: '',
    });

    expect(component.defaultCancelUrl).toBe('/cloud-foundry/cf-123/users');
  });
});
