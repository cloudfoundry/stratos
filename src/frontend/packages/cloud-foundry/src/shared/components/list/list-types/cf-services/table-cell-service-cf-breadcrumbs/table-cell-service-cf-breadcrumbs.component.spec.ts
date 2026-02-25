import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach } from 'vitest';

import { generateCfBaseTestModulesNoShared } from '@test-framework/cloud-foundry-endpoint-service.helper';
import { LongRunningCfOperationsService } from '../../../../../data-services/long-running-cf-op.service';
import { CfOrgSpaceLinksComponent } from '../../../../cf-org-space-links/cf-org-space-links.component';
import { TableCellServiceCfBreadcrumbsComponent } from './table-cell-service-cf-breadcrumbs.component';
describe('TableCellServiceCfBreadcrumbsComponent', () => {
  let component: TableCellServiceCfBreadcrumbsComponent;
  let fixture: ComponentFixture<TableCellServiceCfBreadcrumbsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        TableCellServiceCfBreadcrumbsComponent,
        CfOrgSpaceLinksComponent,
        ...generateCfBaseTestModulesNoShared(),
      ],
      providers: [
        LongRunningCfOperationsService,
        provideZonelessChangeDetection(),
      ],
    })
      .compileComponents();

    fixture = TestBed.createComponent(TableCellServiceCfBreadcrumbsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
