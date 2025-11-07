import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach } from 'vitest';

import { APIResource } from '@stratosui/store/types/api.types';
import { EventTabActorIconPipe } from './event-tab-actor-icon.pipe';
import { TableCellEventActionComponent } from './table-cell-event-action.component';

describe('TableCellEventActionComponent', () => {
  let component: TableCellEventActionComponent;
  let fixture: ComponentFixture<TableCellEventActionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TableCellEventActionComponent, EventTabActorIconPipe],
      providers: [provideZonelessChangeDetection()],
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
