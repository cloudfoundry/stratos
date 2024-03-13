import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ChooseTypeComponent } from './choose-type.component';

describe('ChooseTypeComponent', () => {
  let component: ChooseTypeComponent;
  let fixture: ComponentFixture<ChooseTypeComponent>;

  beforeEach(waitForAsync(() => {
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
