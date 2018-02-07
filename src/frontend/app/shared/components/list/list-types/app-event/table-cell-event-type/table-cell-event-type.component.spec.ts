import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TableCellEventTypeComponent } from './table-cell-event-type.component';
import { EntityInfo } from '../../../../../../store/types/api.types';

describe('TableCellEventTypeComponent', () => {
  let component: TableCellEventTypeComponent<EntityInfo>;
  let fixture: ComponentFixture<TableCellEventTypeComponent<EntityInfo>>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [TableCellEventTypeComponent]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TableCellEventTypeComponent);
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
