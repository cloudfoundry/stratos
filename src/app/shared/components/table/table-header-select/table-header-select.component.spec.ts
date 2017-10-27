import { ITableDataSource } from '../../../data-sources/table-data-source';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TableHeaderSelectComponent } from './table-header-select.component';
import { CoreModule } from '../../../../core/core.module';

describe('TableHeaderSelectComponent', () => {
  let component: TableHeaderSelectComponent<any>;
  let fixture: ComponentFixture<TableHeaderSelectComponent<any>>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [TableHeaderSelectComponent],
      imports: [CoreModule]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TableHeaderSelectComponent);
    component = fixture.componentInstance;
    component.dataSource = {} as ITableDataSource<any>;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
