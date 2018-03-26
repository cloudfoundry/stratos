import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TableCellFeatureFlagStateComponent } from './table-cell-feature-flag-state.component';

import {
  BaseTestModulesNoShared,
} from '../../../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { BooleanIndicatorComponent } from '../../../../boolean-indicator/boolean-indicator.component';

describe('TableCellFeatureFlagStateComponent', () => {
  let component: TableCellFeatureFlagStateComponent;
  let fixture: ComponentFixture<TableCellFeatureFlagStateComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [TableCellFeatureFlagStateComponent, BooleanIndicatorComponent],
      imports: [...BaseTestModulesNoShared]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TableCellFeatureFlagStateComponent);
    component = fixture.componentInstance;
    component.row = {
      entity: {
        name: 'test',
        enabled: true,

      },
      metadata: {
        guid: 'test',
        created_at: '',
        updated_at: '',
        url: ''
      }
    };
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
