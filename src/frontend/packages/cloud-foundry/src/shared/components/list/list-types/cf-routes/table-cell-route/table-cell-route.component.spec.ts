import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { RouterTestingModule } from '@angular/router/testing';

import { generateCfStoreModules } from '../../../../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { APIResource } from '../../../../../../../../store/src/types/api.types';
import { ListCfRoute } from '../cf-routes-data-source-base';
import { TableCellRouteComponent } from './table-cell-route.component';

describe('TableCellRouteComponent', () => {
  let component: TableCellRouteComponent;
  let fixture: ComponentFixture<TableCellRouteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TableCellRouteComponent,
      imports: [
        ...generateCfStoreModules(),
        RouterTestingModule,
      ]
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
