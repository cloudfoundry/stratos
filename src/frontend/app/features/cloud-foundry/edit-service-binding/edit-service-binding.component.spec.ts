import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EditServiceBindingComponent } from './edit-service-binding.component';

describe('EditServiceBindingComponent', () => {
  let component: EditServiceBindingComponent;
  let fixture: ComponentFixture<EditServiceBindingComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ EditServiceBindingComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EditServiceBindingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
