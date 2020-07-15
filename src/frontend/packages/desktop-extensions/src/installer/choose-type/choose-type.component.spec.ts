import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ChooseTypeComponent } from './choose-type.component';

describe('ChooseTypeComponent', () => {
  let component: ChooseTypeComponent;
  let fixture: ComponentFixture<ChooseTypeComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ChooseTypeComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ChooseTypeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
