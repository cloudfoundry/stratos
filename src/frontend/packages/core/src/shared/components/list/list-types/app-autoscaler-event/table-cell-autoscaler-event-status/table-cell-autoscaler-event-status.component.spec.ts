import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TableCellAutoscalerEventStatusComponent } from './table-cell-autoscaler-event-status.component';
import { EntityInfo } from '../../../../../../../../store/src/types/api.types';

describe('TableCellAutoscalerEventTypeComponent', () => {
  let component: TableCellAutoscalerEventStatusComponent<EntityInfo>;
  let fixture: ComponentFixture<TableCellAutoscalerEventStatusComponent<EntityInfo>>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [TableCellAutoscalerEventStatusComponent]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent<TableCellAutoscalerEventStatusComponent<EntityInfo>>(TableCellAutoscalerEventStatusComponent);
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
