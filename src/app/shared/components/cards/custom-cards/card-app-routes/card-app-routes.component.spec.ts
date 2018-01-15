import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CardAppRoutesComponent } from './card-app-routes.component';

describe('CardAppRoutesComponent', () => {
  let component: CardAppRoutesComponent;
  let fixture: ComponentFixture<CardAppRoutesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CardAppRoutesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CardAppRoutesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
