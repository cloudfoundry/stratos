import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CardAppStatusComponent } from './card-app-status.component';

describe('CardAppStatusComponent', () => {
  let component: CardAppStatusComponent;
  let fixture: ComponentFixture<CardAppStatusComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CardAppStatusComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CardAppStatusComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
