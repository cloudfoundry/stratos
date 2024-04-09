import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { BaseTestModulesNoShared } from '../../../../../../test-framework/core-test.helper';
import { TableCellFavoriteComponent } from './table-cell-favorite.component';

describe('TableCellFavoriteComponent', () => {
  let component: TableCellFavoriteComponent<any, any>;
  let fixture: ComponentFixture<TableCellFavoriteComponent<any, any>>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [
        TableCellFavoriteComponent,
      ],
      imports: [
        ...BaseTestModulesNoShared
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TableCellFavoriteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
