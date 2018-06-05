import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfirmDetachComponent } from './confirm-detach.component';

describe('ConfirmDetachComponent', () => {
  let component: ConfirmDetachComponent;
  let fixture: ComponentFixture<ConfirmDetachComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ConfirmDetachComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ConfirmDetachComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
