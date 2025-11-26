import { Component, provideZonelessChangeDetection } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { provideMockStore } from '@ngrx/store/testing';
import { describe, it, expect, beforeEach } from 'vitest';

import { CurrentUserPermissionsService } from '@stratosui/core';
import { cfCurrentUserPermissionsService } from '@stratosui/cloud-foundry';

import { CfUserPermissionDirective } from './cf-user-permission.directive';

@Component({
  standalone: false,
  template: `
    <div *appCfUserPermission="permission">
      Test Content
    </div>
  `
})
class TestUserPermissionComponent {
  permission: unknown;
}

describe('CfUserPermissionDirective', () => {
  let component: TestUserPermissionComponent;
  let fixture: ComponentFixture<TestUserPermissionComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        NoopAnimationsModule,
        CfUserPermissionDirective,
      ],
      declarations: [
        TestUserPermissionComponent,
      ],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideMockStore({}),
        ...cfCurrentUserPermissionsService,
      ]
    });
    fixture = TestBed.createComponent(TestUserPermissionComponent);
    component = fixture.componentInstance;
  });

  it('should create an instance', () => {
    expect(component).toBeTruthy();
  });
});
