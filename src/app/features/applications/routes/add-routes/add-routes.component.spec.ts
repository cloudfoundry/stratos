import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AddRoutesComponent } from './add-routes.component';

describe('AddRoutesComponent', () => {
  let component: AddRoutesComponent;
  let fixture: ComponentFixture<AddRoutesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AddRoutesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AddRoutesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
