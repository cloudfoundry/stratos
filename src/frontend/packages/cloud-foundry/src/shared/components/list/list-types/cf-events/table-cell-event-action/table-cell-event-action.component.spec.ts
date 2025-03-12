import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { CoreModule } from '../../../../../../../../core/src/core/core.module';
import { APIResource } from '../../../../../../../../store/src/types/api.types';
import { EventTabActorIconPipe } from './event-tab-actor-icon.pipe';
import { TableCellEventActionComponent } from './table-cell-event-action.component';

describe('TableCellEventActionComponent', () => {
  let component: TableCellEventActionComponent;
  let fixture: ComponentFixture<TableCellEventActionComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [TableCellEventActionComponent, EventTabActorIconPipe],
      imports: [CoreModule]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent<TableCellEventActionComponent>(TableCellEventActionComponent);
    component = fixture.componentInstance;
    component.row = {
      entity: {}
    } as APIResource;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
