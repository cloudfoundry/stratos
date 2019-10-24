import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SelectRolesConfirmComponent } from './select-roles-confirm.component';

describe('SelectRolesConfirmComponent', () => {
  let component: SelectRolesConfirmComponent;
  let fixture: ComponentFixture<SelectRolesConfirmComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SelectRolesConfirmComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SelectRolesConfirmComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
