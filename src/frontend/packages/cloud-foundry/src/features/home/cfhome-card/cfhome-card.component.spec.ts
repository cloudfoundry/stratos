import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CFHomeCardComponent } from './cfhome-card.component';

describe('CFHomeCardComponent', () => {
  let component: CFHomeCardComponent;
  let fixture: ComponentFixture<CFHomeCardComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CFHomeCardComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CFHomeCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
