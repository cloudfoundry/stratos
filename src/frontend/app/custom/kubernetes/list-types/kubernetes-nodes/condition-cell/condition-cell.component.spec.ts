import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ConditionCellComponent } from './condition-cell.component';

describe('ConditionCellComponent', () => {
  let component: ConditionCellComponent;
  let fixture: ComponentFixture<ConditionCellComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ConditionCellComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ConditionCellComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
