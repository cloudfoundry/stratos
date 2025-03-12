import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import {
  generateCfBaseTestModulesNoShared,
} from '../../../../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { LongRunningCfOperationsService } from '../../../../../data-services/long-running-cf-op.service';
import { TableCellServiceReferencesComponent } from './table-cell-service-references.component';

describe('TableCellServiceReferencesComponent', () => {
  let component: TableCellServiceReferencesComponent;
  let fixture: ComponentFixture<TableCellServiceReferencesComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [
        TableCellServiceReferencesComponent,
      ],
      imports: [
        generateCfBaseTestModulesNoShared()
      ],
      providers: [
        LongRunningCfOperationsService
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TableCellServiceReferencesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
