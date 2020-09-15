import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BaseTestModulesNoShared } from '../../../../test-framework/core-test.helper';
import { ExtensionButtonsComponent } from './extension-buttons.component';

describe('ExtensionButtonsComponent', () => {
  let component: ExtensionButtonsComponent;
  let fixture: ComponentFixture<ExtensionButtonsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ExtensionButtonsComponent],
      imports: [...BaseTestModulesNoShared],
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ExtensionButtonsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
