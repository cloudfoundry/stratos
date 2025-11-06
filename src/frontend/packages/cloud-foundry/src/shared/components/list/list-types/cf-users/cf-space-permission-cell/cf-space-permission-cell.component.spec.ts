import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';

import {
  generateCfBaseTestModules,
  generateTestCfEndpointServiceProvider,
} from '../../../../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { CfSpacePermissionCellComponent } from './cf-space-permission-cell.component';

describe('CfSpacePermissionCellComponent', () => {
  let component: CfSpacePermissionCellComponent;
  let fixture: ComponentFixture<CfSpacePermissionCellComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CfSpacePermissionCellComponent],
      imports: generateCfBaseTestModules(),
      providers: [...generateTestCfEndpointServiceProvider()]
    })
      .compileComponents();

    fixture = TestBed.createComponent(CfSpacePermissionCellComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
