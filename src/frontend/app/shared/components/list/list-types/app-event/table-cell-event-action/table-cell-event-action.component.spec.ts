import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TableCellEventActionComponent } from './table-cell-event-action.component';
import { EntityInfo } from '../../../../../../store/types/api.types';
import { CoreModule } from '../../../../../../core/core.module';
import { EventTabActorIconPipe } from './event-tab-actor-icon.pipe';

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
    fixture = TestBed.createComponent(TableCellEventActionComponent);
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
