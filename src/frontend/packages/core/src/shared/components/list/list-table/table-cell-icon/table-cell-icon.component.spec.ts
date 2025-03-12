import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { CoreModule } from '../../../../../core/core.module';
import { TableCellIconComponent } from './table-cell-icon.component';

describe('TableCellIconComponent', () => {
  let component: TableCellIconComponent;
  let fixture: ComponentFixture<TableCellIconComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [
        TableCellIconComponent,
      ],
      imports: [
        CoreModule
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TableCellIconComponent);
    component = fixture.componentInstance;
    component.row = true;
    component.config = {
      getIcon: (row) => ({
        icon: ''
      })
    };
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
