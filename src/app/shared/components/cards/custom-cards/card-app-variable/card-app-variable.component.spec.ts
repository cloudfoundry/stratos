import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CardAppVariableComponent } from './card-app-variable.component';

describe('CardAppVariableComponent', () => {
  let component: CardAppVariableComponent;
  let fixture: ComponentFixture<CardAppVariableComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CardAppVariableComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CardAppVariableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
