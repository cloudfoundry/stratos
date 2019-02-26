import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TableCellAutoscalerEventTimestampComponent } from './table-cell-autoscler-event-timestamp.component';
import { EntityInfo } from '../../../../../../store/types/api.types';

describe('TableCellAutoscalerEventTimestampComponent', () => {
  let component: TableCellAutoscalerEventTimestampComponent<EntityInfo>;
  let fixture: ComponentFixture<TableCellAutoscalerEventTimestampComponent<EntityInfo>>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [TableCellAutoscalerEventTimestampComponent]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent<TableCellAutoscalerEventTimestampComponent<EntityInfo>>(TableCellAutoscalerEventTimestampComponent);
    component = fixture.componentInstance;
    component.row = {
      entity: {}
    } as EntityInfo;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
