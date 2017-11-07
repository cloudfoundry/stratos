import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { CardEventComponent } from './card-app-event.component';


describe('CardEventComponent', () => {
  let component: CardEventComponent;
  let fixture: ComponentFixture<CardEventComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CardEventComponent]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CardEventComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
