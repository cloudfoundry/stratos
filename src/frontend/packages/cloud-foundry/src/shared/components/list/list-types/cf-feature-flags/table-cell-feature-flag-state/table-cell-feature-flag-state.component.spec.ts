import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import {
  BooleanIndicatorComponent,
} from '../../../../../../../../core/src/shared/components/boolean-indicator/boolean-indicator.component';
import {
  generateCfBaseTestModulesNoShared,
} from '../../../../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { TableCellFeatureFlagStateComponent } from './table-cell-feature-flag-state.component';

describe('TableCellFeatureFlagStateComponent', () => {
  let component: TableCellFeatureFlagStateComponent;
  let fixture: ComponentFixture<TableCellFeatureFlagStateComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [TableCellFeatureFlagStateComponent, BooleanIndicatorComponent],
      imports: generateCfBaseTestModulesNoShared()
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TableCellFeatureFlagStateComponent);
    component = fixture.componentInstance;
    component.row = {
      name: 'test',
      enabled: true,
    };
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
