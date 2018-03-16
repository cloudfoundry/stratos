import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AppServiceBindingCardComponent } from './app-service-binding-card.component';

describe('AppServiceBindingCardComponent', () => {
  let component: AppServiceBindingCardComponent;
  let fixture: ComponentFixture<AppServiceBindingCardComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AppServiceBindingCardComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AppServiceBindingCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
