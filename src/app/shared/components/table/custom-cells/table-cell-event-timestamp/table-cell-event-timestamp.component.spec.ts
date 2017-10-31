import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TableCellEventTimestampComponent } from './table-cell-event-timestamp.component';
import { EntityInfo } from '../../../../../store/types/api.types';

describe('TableCellEventTimestampComponent', () => {
  let component: TableCellEventTimestampComponent<EntityInfo>;
  let fixture: ComponentFixture<TableCellEventTimestampComponent<EntityInfo>>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [TableCellEventTimestampComponent]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TableCellEventTimestampComponent);
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
