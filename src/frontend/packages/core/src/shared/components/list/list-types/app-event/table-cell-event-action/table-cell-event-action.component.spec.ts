import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TableCellEventActionComponent } from './table-cell-event-action.component';
import { CoreModule } from '../../../../../../core/core.module';
import { EventTabActorIconPipe } from './event-tab-actor-icon.pipe';
import { EntityInfo } from '../../../../../../../../store/src/types/api.types';

describe('TableCellEventActionComponent', () => {
  let component: TableCellEventActionComponent<EntityInfo>;
  let fixture: ComponentFixture<TableCellEventActionComponent<EntityInfo>>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [TableCellEventActionComponent, EventTabActorIconPipe],
      imports: [CoreModule]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent<TableCellEventActionComponent<EntityInfo>>(TableCellEventActionComponent);
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
