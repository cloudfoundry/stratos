import { Component, provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';

import { AppTestModule } from '@test-framework/core-test.helper';
import {
  createBasicStoreModule,
  STORE_TEST_PROVIDERS,
} from '@stratosui/store/testing';
import { EntityCatalogTestModule, TEST_CATALOGUE_ENTITIES, generateStratosEntities } from '@stratosui/store';
import { UserPermissionDirective } from './user-permission.directive';
import { CurrentUserPermissionsService } from '../core/permissions/current-user-permissions.service';

@Component({
  imports: [UserPermissionDirective],
  template: `<div *appUserPermission="['test.permission']">Test Content</div>`
})
class TestUserPermissionComponent {
}

describe('UserPermissionDirective', () => {
  let component: TestUserPermissionComponent;
  let fixture: ComponentFixture<TestUserPermissionComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        CurrentUserPermissionsService,
        ...(STORE_TEST_PROVIDERS || []),
      ],
      imports: [
        {
          ngModule: EntityCatalogTestModule,
          providers: [
            {
              provide: TEST_CATALOGUE_ENTITIES,
              useValue: [
                ...generateStratosEntities(),
              ]
            }
          ]
        },
        createBasicStoreModule(),
        AppTestModule,
        UserPermissionDirective,
        TestUserPermissionComponent
      ]
    });
    fixture = TestBed.createComponent(TestUserPermissionComponent);
    component = fixture.componentInstance;
  });

  it('should create an instance', () => {
    expect(component).toBeTruthy();
  });
});
