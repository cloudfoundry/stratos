import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TableHeaderSelectComponent } from './table-header-select.component';
import { CoreModule } from '../../../../../core/core.module';
import { IListDataSource } from '../../data-sources-controllers/list-data-source-types';

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
    component.dataSource = {} as IListDataSource<any>;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
