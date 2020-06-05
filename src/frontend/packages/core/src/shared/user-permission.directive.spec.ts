import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BaseTestModules } from '../../test-framework/core-test.helper';

@Component({
  template: `<input type="text" *appUserPermission="">`
})
class TestUserPermissionComponent {
}

describe('UserPermissionDirective', () => {
  let component: TestUserPermissionComponent;
  let fixture: ComponentFixture<TestUserPermissionComponent>;
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        ...BaseTestModules
      ],
      declarations: [TestUserPermissionComponent]
    });
    fixture = TestBed.createComponent(TestUserPermissionComponent);
    component = fixture.componentInstance;
  });
  it('should create an instance', () => {
    expect(component).toBeTruthy();
  });
});
