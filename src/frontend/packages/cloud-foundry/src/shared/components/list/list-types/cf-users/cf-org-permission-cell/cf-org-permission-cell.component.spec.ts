import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach } from 'vitest';

import { SharedModule } from '../../../../../../../../core/src/shared/shared.module';
import {
  generateCfStoreModules,
  generateTestCfEndpointServiceProvider,
} from '../../../../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { CfOrgPermissionCellComponent } from './cf-org-permission-cell.component';
import { HttpClientModule } from '@angular/common/http';

describe('CfUserPermissionCellComponent', () => {
  let component: CfOrgPermissionCellComponent;
  let fixture: ComponentFixture<CfOrgPermissionCellComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        CfOrgPermissionCellComponent,
        ...generateCfStoreModules(),
        SharedModule,
        HttpClientModule
      ],
      providers: [
        
        ...generateTestCfEndpointServiceProvider()
      ,
        provideZonelessChangeDetection()
      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(CfOrgPermissionCellComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
