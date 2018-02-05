import { ValuesPipe } from '../../../../../pipes/values.pipe';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TableCellEventDetailComponent } from './table-cell-event-detail.component';
import { EntityInfo } from '../../../../../../store/types/api.types';

describe('TableCellEventDetailComponent', () => {
  let component: TableCellEventDetailComponent<EntityInfo>;
  let fixture: ComponentFixture<TableCellEventDetailComponent<EntityInfo>>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [TableCellEventDetailComponent, ValuesPipe]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TableCellEventDetailComponent);
    component = fixture.componentInstance;
    component.row = {
      entity: {
        metadata: {}
      }
    } as EntityInfo;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
