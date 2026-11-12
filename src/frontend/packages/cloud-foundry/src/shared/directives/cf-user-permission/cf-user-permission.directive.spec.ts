import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { describe, it, expect, beforeEach } from 'vitest';

import { CurrentUserPermissionsService } from '@stratosui/core';
import { cfCurrentUserPermissionsService } from '@stratosui/cloud-foundry';

import { CfUserPermissionDirective } from './cf-user-permission.directive';

@Component({
  imports: [CfUserPermissionDirective],
  template: `
    <div *appCfUserPermission="permission">
      Test Content
    </div>
  `
})
class TestUserPermissionComponent {
  permission: any;
}

describe('CfUserPermissionDirective', () => {
  let component: TestUserPermissionComponent;
  let fixture: ComponentFixture<TestUserPermissionComponent>;
  const allowed = signal(false);

  beforeEach(() => {
    allowed.set(false);
    TestBed.configureTestingModule({
      imports: [
        NoopAnimationsModule,
        CfUserPermissionDirective,
        TestUserPermissionComponent,
      ],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        ...cfCurrentUserPermissionsService,
        { provide: CurrentUserPermissionsService, useValue: { can: () => allowed } },
      ]
    });
    fixture = TestBed.createComponent(TestUserPermissionComponent);
    component = fixture.componentInstance;
  });

  it('should create an instance', () => {
    expect(component).toBeTruthy();
  });

  it('shows its content only while the permission holds', async () => {
    const text = () => (fixture.nativeElement as HTMLElement).textContent?.trim();
    await fixture.whenStable();
    expect(text()).toBe('');
    allowed.set(true);
    await fixture.whenStable();
    expect(text()).toBe('Test Content');
    allowed.set(true);
    await fixture.whenStable();
    expect(text()).toBe('Test Content');
    allowed.set(false);
    await fixture.whenStable();
    expect(text()).toBe('');
  });
});
