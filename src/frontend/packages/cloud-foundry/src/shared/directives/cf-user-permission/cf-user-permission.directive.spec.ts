import { Component, provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { describe, it, expect, beforeEach } from 'vitest';

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

  beforeEach(() => {
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
      ]
    });
    fixture = TestBed.createComponent(TestUserPermissionComponent);
    component = fixture.componentInstance;
  });

  it('should create an instance', () => {
    expect(component).toBeTruthy();
  });
});
