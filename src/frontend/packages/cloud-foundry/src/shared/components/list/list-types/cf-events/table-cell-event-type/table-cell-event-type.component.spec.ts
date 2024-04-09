import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { EntityInfo } from '../../../../../../../../store/src/types/api.types';
import { TableCellEventTypeComponent } from './table-cell-event-type.component';

describe('TableCellEventTypeComponent', () => {
  let component: TableCellEventTypeComponent<EntityInfo>;
  let fixture: ComponentFixture<TableCellEventTypeComponent<EntityInfo>>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [TableCellEventTypeComponent]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent<TableCellEventTypeComponent<EntityInfo>>(TableCellEventTypeComponent);
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
