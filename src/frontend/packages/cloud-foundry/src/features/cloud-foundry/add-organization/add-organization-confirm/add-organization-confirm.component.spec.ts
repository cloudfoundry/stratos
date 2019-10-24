import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AddOrganizationConfirmComponent } from './add-organization-confirm.component';

describe('AddOrganizationConfirmComponent', () => {
  let component: AddOrganizationConfirmComponent;
  let fixture: ComponentFixture<AddOrganizationConfirmComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AddOrganizationConfirmComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AddOrganizationConfirmComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
