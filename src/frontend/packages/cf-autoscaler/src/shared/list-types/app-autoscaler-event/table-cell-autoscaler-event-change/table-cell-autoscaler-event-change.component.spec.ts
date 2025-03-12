import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { MatIcon } from '@angular/material/icon';

import { EntityInfo } from '../../../../../../store/src/types/api.types';
import { TableCellAutoscalerEventChangeIconPipe } from './table-cell-autoscaler-event-change-icon.pipe';
import { TableCellAutoscalerEventChangeComponent } from './table-cell-autoscaler-event-change.component';

describe('TableCellAutoscalerEventChangeComponent', () => {
  let component: TableCellAutoscalerEventChangeComponent;
  let fixture: ComponentFixture<TableCellAutoscalerEventChangeComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [TableCellAutoscalerEventChangeComponent, MatIcon, TableCellAutoscalerEventChangeIconPipe]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent<TableCellAutoscalerEventChangeComponent>(TableCellAutoscalerEventChangeComponent);
    component = fixture.componentInstance;
    component.row = {
      entity: {
        type: ''
      }
    } as EntityInfo;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
