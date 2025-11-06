import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';

import { APIResource } from '../../../../../../../../store/src/types/api.types';
import { EventTabActorIconPipe } from './event-tab-actor-icon.pipe';
import { TableCellEventActionComponent } from './table-cell-event-action.component';

describe('TableCellEventActionComponent', () => {
  let component: TableCellEventActionComponent;
  let fixture: ComponentFixture<TableCellEventActionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TableCellEventActionComponent, EventTabActorIconPipe,
      imports: [CoreModule]
    })
      .compileComponents();

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
