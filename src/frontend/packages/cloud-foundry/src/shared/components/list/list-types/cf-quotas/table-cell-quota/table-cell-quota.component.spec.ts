import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { createBasicStoreModule } from '@stratosui/store/testing';

import { APIResource } from '../../../../../../../../store/src/types/api.types';
import { IQuotaDefinition } from '../../../../../../cf-api.types';
import { TableCellQuotaComponent } from './table-cell-quota.component';

describe('TableCellQuotaComponent', () => {
  let component: TableCellQuotaComponent;
  let fixture: ComponentFixture<TableCellQuotaComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [TableCellQuotaComponent],
      imports: [
        RouterTestingModule,
        createBasicStoreModule(),
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TableCellQuotaComponent);
    component = fixture.componentInstance;
    component.config = {
      baseUrl: [
        '/cloud-foundry',
        'cfGuid',
        'organizations',
        'orgGuid',
        'space-quota-definitions'
      ]
    },
    component.row = {
      metadata: {
        guid: '',
      },
      entity: {
        guid: '',
        name: 'test0',
        memory_limit: 1000,
        app_instance_limit: -1,
        instance_memory_limit: -1,
        total_services: -1,
        total_routes: -1,
      }
    } as APIResource<IQuotaDefinition>;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
