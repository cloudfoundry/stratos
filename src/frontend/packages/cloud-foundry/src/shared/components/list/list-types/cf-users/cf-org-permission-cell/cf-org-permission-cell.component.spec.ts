import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';

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

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [
        CfOrgPermissionCellComponent
      ],
      providers: [
        ...generateTestCfEndpointServiceProvider()
      ],
      imports: [
        ...generateCfStoreModules(),
        SharedModule,
        HttpClientModule
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CfOrgPermissionCellComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
