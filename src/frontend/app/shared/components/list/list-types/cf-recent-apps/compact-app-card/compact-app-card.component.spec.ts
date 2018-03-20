import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CompactAppCardComponent } from './compact-app-card.component';

describe('CompactAppCardComponent', () => {
  let component: CompactAppCardComponent;
  let fixture: ComponentFixture<CompactAppCardComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CompactAppCardComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CompactAppCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
