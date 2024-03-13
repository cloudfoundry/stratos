import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { TableRowExpandedService } from '../table-row/table-row-expanded-service';
import { TableCellExpanderComponent } from './table-cell-expander.component';

describe('TableCellExpanderComponent', () => {
  let component: TableCellExpanderComponent;
  let fixture: ComponentFixture<TableCellExpanderComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [TableCellExpanderComponent],
      imports: [
        NoopAnimationsModule
      ],
      providers: [
        TableRowExpandedService
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TableCellExpanderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
