import { Component, provideZonelessChangeDetection, signal, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';

import { UserPermissionDirective } from './user-permission.directive';
import { CurrentUserPermissionsService } from '../core/permissions/current-user-permissions.service';

@Component({
  imports: [UserPermissionDirective],
  template: `<div *appUserPermission="permissions()">Test Content</div>`
})
class TestUserPermissionComponent {
  readonly permissions = signal<any[] | null>(['a', 'b']);
}

describe('UserPermissionDirective', () => {
  let fixture: ComponentFixture<TestUserPermissionComponent>;
  const granted: Record<string, WritableSignal<boolean>> = {};

  beforeEach(async () => {
    granted['a'] = signal(false);
    granted['b'] = signal(false);
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: CurrentUserPermissionsService, useValue: { can: (p: string) => granted[p] } },
      ],
      imports: [TestUserPermissionComponent]
    });
    fixture = TestBed.createComponent(TestUserPermissionComponent);
    await fixture.whenStable();
  });

  const shown = () => !!(fixture.nativeElement as HTMLElement).textContent?.includes('Test Content');

  it('shows the content while any of the permissions passes', async () => {
    expect(shown()).toBe(false);
    granted['b'].set(true);
    await fixture.whenStable();
    expect(shown()).toBe(true);
    granted['b'].set(false);
    await fixture.whenStable();
    expect(shown()).toBe(false);
  });

  it('removes the content when the permissions are cleared', async () => {
    granted['a'].set(true);
    await fixture.whenStable();
    expect(shown()).toBe(true);
    fixture.componentInstance.permissions.set(null);
    await fixture.whenStable();
    expect(shown()).toBe(false);
  });
});
