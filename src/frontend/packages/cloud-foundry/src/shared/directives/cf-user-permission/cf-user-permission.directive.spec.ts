import {  Component, TemplateRef, provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';

import { BaseTestModules } from '../../../../../core/test-framework/core-test.helper';
@Component({
  standalone: false,
  template: `<input type="text" appCfUserPermission>`
})
class TestUserPermissionComponent {
}

class MockTemplateRef { }

describe('CfUserPermissionDirective', () => {
  let component: TestUserPermissionComponent;
  let fixture: ComponentFixture<TestUserPermissionComponent>;
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        ...BaseTestModules,
        TestUserPermissionComponent,
    ],
      providers: [
        
        { provide: TemplateRef, useClass: MockTemplateRef },

        provideZonelessChangeDetection(),
      ]
    });
    fixture = TestBed.createComponent(TestUserPermissionComponent);
    component = fixture.componentInstance;
  });
  it('should create an instance', () => {
    expect(component).toBeTruthy();
  });
});
