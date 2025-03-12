import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { EntityInfo } from '../../../../../../../../store/src/types/api.types';
import { TableCellEventTimestampComponent } from './table-cell-event-timestamp.component';

describe('TableCellEventTimestampComponent', () => {
  let component: TableCellEventTimestampComponent<EntityInfo>;
  let fixture: ComponentFixture<TableCellEventTimestampComponent<EntityInfo>>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [TableCellEventTimestampComponent]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent<TableCellEventTimestampComponent<EntityInfo>>(TableCellEventTimestampComponent);
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
