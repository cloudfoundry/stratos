import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CardStatusComponent } from './card-status.component';

describe('CardStatusComponent', () => {
  let component: CardStatusComponent;
  let fixture: ComponentFixture<CardStatusComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CardStatusComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CardStatusComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
