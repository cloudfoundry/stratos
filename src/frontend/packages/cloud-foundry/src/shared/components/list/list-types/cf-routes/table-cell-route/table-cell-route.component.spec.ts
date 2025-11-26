import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { StoreModule } from '@ngrx/store';
import { describe, it, expect, beforeEach } from 'vitest';
import { appReducers, type APIResource } from '@stratosui/store';
import type { ListCfRoute } from '../cf-routes-data-source-base';
import { TableCellRouteComponent } from './table-cell-route.component';

describe('TableCellRouteComponent', () => {
  let component: TableCellRouteComponent;
  let fixture: ComponentFixture<TableCellRouteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        TableCellRouteComponent,
        StoreModule.forRoot(appReducers, {
          runtimeChecks: { strictStateImmutability: false, strictActionImmutability: false }
        }),
      ],
      providers: [
        provideZonelessChangeDetection(),
      ],
    })
      .compileComponents();

    fixture = TestBed.createComponent(TableCellRouteComponent);
    component = fixture.componentInstance;
    component.row = {
      entity: {
        domain: {
          entity: {
            name: 'test'
          }
        }
      }
    } as APIResource<ListCfRoute>;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
