import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { of } from 'rxjs';

import { MAT_DIALOG_DATA, TailwindDialogRef } from '@stratosui/core';

import { CfIdentityProvidersService } from '../../../../shared/data-services/cf-identity-providers.service';
import { AddUserDialogComponent, AddUserDialogData } from './add-user-dialog.component';

const CF_GUID = 'test-cf-guid';

function make(data: AddUserDialogData, idpsOrigins: string[] = []) {
  const close = vi.fn();
  const listOrigins = vi.fn().mockReturnValue(of(idpsOrigins));

  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [
      provideZonelessChangeDetection(),
      provideHttpClient(),
      provideHttpClientTesting(),
      { provide: MAT_DIALOG_DATA, useValue: data },
      { provide: TailwindDialogRef, useValue: { close } },
      { provide: CfIdentityProvidersService, useValue: { listOrigins } },
    ],
  });

  // createComponent (no detectChanges) runs constructor — initialising signals
  // from MAT_DIALOG_DATA — without rendering child components.
  const fixture = TestBed.createComponent(AddUserDialogComponent);
  return { cmp: fixture.componentInstance, close, listOrigins };
}

describe('AddUserDialogComponent', () => {
  beforeEach(() => TestBed.resetTestingModule());

  afterEach(() => {
    const httpMock = TestBed.inject(HttpTestingController);
    httpMock.match(() => true).forEach(req => req.flush({}));
    httpMock.verify();
  });

  it('defaults origin to "uaa"', () => {
    const { cmp } = make({ cfGuid: CF_GUID, userInviteAllowed: false });
    expect(cmp.origin()).toBe('uaa');
  });

  it('hides the Invite tab when userInviteAllowed is false', () => {
    const { cmp } = make({ cfGuid: CF_GUID, userInviteAllowed: false });
    expect(cmp.inviteTabVisible()).toBe(false);
  });

  it('shows the Invite tab when userInviteAllowed is true', () => {
    const { cmp } = make({ cfGuid: CF_GUID, userInviteAllowed: true });
    expect(cmp.inviteTabVisible()).toBe(true);
  });

  it('canSubmit is false when there are no valid identities', () => {
    const { cmp } = make({ cfGuid: CF_GUID, userInviteAllowed: false });
    // No identities set — default state
    expect(cmp.canSubmit()).toBe(false);
  });

  it('locks org when opened with an orgGuid', () => {
    const { cmp } = make({ cfGuid: CF_GUID, orgGuid: 'org-123', userInviteAllowed: false });
    expect(cmp.orgLocked()).toBe(true);
  });

  it('populates originOptions from listOrigins and degrades gracefully on empty', () => {
    const { cmp: cmpWithOptions, listOrigins: spy1 } = make(
      { cfGuid: CF_GUID, userInviteAllowed: false },
      ['uaa', 'ldap']
    );
    expect(spy1).toHaveBeenCalledWith(CF_GUID);
    // After the promise resolves (synchronously via of()) originOptions should
    // contain the two options returned by the service.
    expect(cmpWithOptions.originOptions()).toEqual(['uaa', 'ldap']);

    const { cmp: cmpEmpty } = make(
      { cfGuid: CF_GUID, userInviteAllowed: false },
      []
    );
    // Service returned [] — originOptions stays empty, component still works
    // (free-text entry is always available).
    expect(cmpEmpty.originOptions()).toEqual([]);
  });
});
