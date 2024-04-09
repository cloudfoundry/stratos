import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { TableCellFeatureFlagDescriptionComponent } from './table-cell-feature-flag-description.component';

describe('TableCellFeatureFlagDescriptionComponent', () => {
  let component: TableCellFeatureFlagDescriptionComponent;
  let fixture: ComponentFixture<TableCellFeatureFlagDescriptionComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ TableCellFeatureFlagDescriptionComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TableCellFeatureFlagDescriptionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
