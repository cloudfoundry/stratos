import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MonocularTabBaseComponent } from './monocular-tab-base.component';

describe('MonocularTabBaseComponent', () => {
  let component: MonocularTabBaseComponent;
  let fixture: ComponentFixture<MonocularTabBaseComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MonocularTabBaseComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MonocularTabBaseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
