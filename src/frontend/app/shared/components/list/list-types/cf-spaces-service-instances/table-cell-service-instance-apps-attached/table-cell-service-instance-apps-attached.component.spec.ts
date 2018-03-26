import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BaseTestModulesNoShared } from '../../../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { TableCellServiceInstanceAppsAttachedComponent } from './table-cell-service-instance-apps-attached.component';

describe('TableCellServiceInstanceAppsAttachedComponent', () => {
  let component: TableCellServiceInstanceAppsAttachedComponent<any>;
  let fixture: ComponentFixture<TableCellServiceInstanceAppsAttachedComponent<any>>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [TableCellServiceInstanceAppsAttachedComponent],
      imports: [...BaseTestModulesNoShared]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TableCellServiceInstanceAppsAttachedComponent);
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
