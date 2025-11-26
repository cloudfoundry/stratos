import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach } from 'vitest';

import {
  BooleanIndicatorComponent,
} from '@stratosui/core';
import type { APIResource } from '@stratosui/store';
import type { ListCfRoute } from '../cf-routes-data-source-base';
import { TableCellTCPRouteComponent } from './table-cell-tcproute.component';

describe('TableCellTCPRouteComponent', () => {
  let component: TableCellTCPRouteComponent;
  let fixture: ComponentFixture<TableCellTCPRouteComponent>;
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TableCellTCPRouteComponent, BooleanIndicatorComponent],
      providers: [provideZonelessChangeDetection()],
    })
      .compileComponents();

    fixture = TestBed.createComponent(TableCellTCPRouteComponent);
    component = fixture.componentInstance;
    component.row = {
      entity: {}
    } as APIResource<ListCfRoute>;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
