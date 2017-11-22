import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CardAppComponent } from './card-app.component';

describe('CardAppComponent', () => {
  let component: CardAppComponent;
  let fixture: ComponentFixture<CardAppComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CardAppComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CardAppComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
