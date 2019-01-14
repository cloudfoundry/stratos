import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TableCellFavoriteComponent } from './table-cell-favorite.component';

describe('TableCellFavoriteComponent', () => {
  let component: TableCellFavoriteComponent;
  let fixture: ComponentFixture<TableCellFavoriteComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TableCellFavoriteComponent ]
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
