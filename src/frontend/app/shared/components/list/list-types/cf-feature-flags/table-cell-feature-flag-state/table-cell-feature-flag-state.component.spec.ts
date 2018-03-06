import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TableCellFeatureFlagStateComponent } from './table-cell-feature-flag-state.component';

describe('TableCellFeatureFlagStateComponent', () => {
  let component: TableCellFeatureFlagStateComponent;
  let fixture: ComponentFixture<TableCellFeatureFlagStateComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TableCellFeatureFlagStateComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TableCellFeatureFlagStateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
