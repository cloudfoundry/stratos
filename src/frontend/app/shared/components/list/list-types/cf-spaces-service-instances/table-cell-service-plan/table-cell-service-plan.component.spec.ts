import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TableCellServicePlanComponent } from './table-cell-service-plan.component';
import { BaseTestModulesNoShared } from '../../../../../../test-framework/cloud-foundry-endpoint-service.helper';

describe('TableCellServicePlanComponent', () => {
  let component: TableCellServicePlanComponent<any>;
  let fixture: ComponentFixture<TableCellServicePlanComponent<any>>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [TableCellServicePlanComponent],
      imports: [...BaseTestModulesNoShared]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TableCellServicePlanComponent);
    component = fixture.componentInstance;
    component.row = {
      entity: {
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
