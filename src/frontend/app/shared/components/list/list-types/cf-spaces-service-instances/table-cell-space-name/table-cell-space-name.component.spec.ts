import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TableCellSpaceNameComponent } from './table-cell-space-name.component';
import { BaseTestModulesNoShared } from '../../../../../../test-framework/cloud-foundry-endpoint-service.helper';

describe('TableCellSpaceNameComponent', () => {
  let component: TableCellSpaceNameComponent<any>;
  let fixture: ComponentFixture<TableCellSpaceNameComponent<any>>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TableCellSpaceNameComponent ],
      imports: [BaseTestModulesNoShared]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TableCellSpaceNameComponent);
    component = fixture.componentInstance;
    component.row = {
      entity: {
        service_bindings: [],
        active: true,
        bindable: true,
        description: 'test',
        extra: '',
        label: '',
        info_url: '',
        long_description: '',
        plan_updateable: false,
        tags: [],
        url: '',
        version: ''
      },
      metadata: null
    };
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
