import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DrillDownComponent } from './drill-down.component';

describe('DrillDownComponent', () => {
  let component: DrillDownComponent;
  let fixture: ComponentFixture<DrillDownComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DrillDownComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DrillDownComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
