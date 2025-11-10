import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach } from 'vitest';

import { InviteUsersComponent } from './invite-users.component';
import { ActiveRouteCfOrgSpace } from '../../cf-page.types';

describe('InviteUsersComponent', () => {
  let component: InviteUsersComponent;

  beforeEach(() => {
    // Create mock ActiveRouteCfOrgSpace directly
    const mockActiveRouteCfOrgSpace: ActiveRouteCfOrgSpace = {
      cfGuid: 'test-cf-guid',
      orgGuid: 'test-org-guid',
      spaceGuid: 'test-space-guid'
    };

    // Create component instance directly with mock dependency
    component = new InviteUsersComponent(mockActiveRouteCfOrgSpace);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should set defaultCancelUrl correctly for space level', () => {
    const mockActiveRouteCfOrgSpace: ActiveRouteCfOrgSpace = {
      cfGuid: 'cf-123',
      orgGuid: 'org-456',
      spaceGuid: 'space-789'
    };
    component = new InviteUsersComponent(mockActiveRouteCfOrgSpace);

    expect(component.defaultCancelUrl).toBe('/cloud-foundry/cf-123/organizations/org-456/spaces/space-789/users');
  });

  it('should set defaultCancelUrl correctly for org level', () => {
    const mockActiveRouteCfOrgSpace: ActiveRouteCfOrgSpace = {
      cfGuid: 'cf-123',
      orgGuid: 'org-456',
      spaceGuid: ''
    };
    component = new InviteUsersComponent(mockActiveRouteCfOrgSpace);

    expect(component.defaultCancelUrl).toBe('/cloud-foundry/cf-123/organizations/org-456/users');
  });

  it('should set defaultCancelUrl correctly for cf level', () => {
    const mockActiveRouteCfOrgSpace: ActiveRouteCfOrgSpace = {
      cfGuid: 'cf-123',
      orgGuid: '',
      spaceGuid: ''
    };
    component = new InviteUsersComponent(mockActiveRouteCfOrgSpace);

    expect(component.defaultCancelUrl).toBe('/cloud-foundry/cf-123/users');
  });
});
