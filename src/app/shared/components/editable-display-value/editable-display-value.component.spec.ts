import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EditableDisplayValueComponent } from './editable-display-value.component';

describe('EditableDisplayValueComponent', () => {
  let component: EditableDisplayValueComponent;
  let fixture: ComponentFixture<EditableDisplayValueComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ EditableDisplayValueComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EditableDisplayValueComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
