import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach } from 'vitest';

import { AppChipsComponent } from '../../../../../../../../core/src/shared/components/chips/chips.component';
import {
  generateCfBaseTestModulesNoShared,
} from "@test-framework/cloud-foundry-endpoint-service.helper";
import { LongRunningCfOperationsService } from '../../../../../data-services/long-running-cf-op.service';
import { TableCellServiceTagsComponent } from "./table-cell-service-tags.component";
describe('TableCellServiceTagsComponent', () => {
  let component: TableCellServiceTagsComponent;
  let fixture: ComponentFixture<TableCellServiceTagsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        TableCellServiceTagsComponent,
        AppChipsComponent,
        ...generateCfBaseTestModulesNoShared(),
      ],
      providers: [
        LongRunningCfOperationsService,
        provideZonelessChangeDetection(),
      ],
    })
      .compileComponents();

    fixture = TestBed.createComponent(TableCellServiceTagsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
