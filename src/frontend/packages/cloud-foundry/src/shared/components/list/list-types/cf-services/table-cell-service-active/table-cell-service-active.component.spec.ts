import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { CoreModule } from '../../../../../../../../core/src/core/core.module';
import {
  BooleanIndicatorComponent,
} from '../../../../../../../../core/src/shared/components/boolean-indicator/boolean-indicator.component';
import { TableCellServiceActiveComponent } from './table-cell-service-active.component';

describe('TableCellServiceActiveComponent', () => {
  let component: TableCellServiceActiveComponent;
  let fixture: ComponentFixture<TableCellServiceActiveComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [TableCellServiceActiveComponent, BooleanIndicatorComponent],
      imports: [CoreModule]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TableCellServiceActiveComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
