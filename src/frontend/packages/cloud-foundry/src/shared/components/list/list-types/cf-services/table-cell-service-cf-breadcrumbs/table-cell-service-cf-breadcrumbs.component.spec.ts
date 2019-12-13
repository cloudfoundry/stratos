import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import {
  generateCfBaseTestModulesNoShared,
} from '../../../../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { LongRunningCfOperationsService } from '../../../../../data-services/long-running-cf-op.service';
import { CfOrgSpaceLinksComponent } from '../../../../cf-org-space-links/cf-org-space-links.component';
import { TableCellServiceCfBreadcrumbsComponent } from './table-cell-service-cf-breadcrumbs.component';

describe('TableCellServiceCfBreadcrumbsComponent', () => {
  let component: TableCellServiceCfBreadcrumbsComponent;
  let fixture: ComponentFixture<TableCellServiceCfBreadcrumbsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        TableCellServiceCfBreadcrumbsComponent,
        CfOrgSpaceLinksComponent
        // app-cf-org-space-links
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
    fixture = TestBed.createComponent(TableCellServiceCfBreadcrumbsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
