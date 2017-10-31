import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TableCellSelectComponent } from './table-cell-select.component';
import { CoreModule } from '../../../../core/core.module';
import { ITableDataSource } from '../../../data-sources/table-data-source';

describe('TableCellSelectComponent', () => {
  let component: TableCellSelectComponent<any>;
  let fixture: ComponentFixture<TableCellSelectComponent<any>>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [TableCellSelectComponent],
      imports: [
        CoreModule,
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TableCellSelectComponent);
    component = fixture.componentInstance;
    component.row = {};
    component.dataSource = {} as ITableDataSource<any>;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
