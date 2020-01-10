import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AppChipsComponent } from '../../../../../../../../core/src/shared/components/chips/chips.component';
import {
  generateCfBaseTestModulesNoShared,
} from '../../../../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { LongRunningCfOperationsService } from '../../../../../data-services/long-running-cf-op.service';
import { TableCellServiceTagsComponent } from './table-cell-service-tags.component';

describe('TableCellServiceTagsComponent', () => {
  let component: TableCellServiceTagsComponent;
  let fixture: ComponentFixture<TableCellServiceTagsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        TableCellServiceTagsComponent,
        AppChipsComponent
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
    fixture = TestBed.createComponent(TableCellServiceTagsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
