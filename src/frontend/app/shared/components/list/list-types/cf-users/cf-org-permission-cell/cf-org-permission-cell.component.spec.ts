import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CfOrgPermissionCellComponent } from './cf-org-permission-cell.component';
import {
  BaseTestModules,
  generateTestCfEndpointServiceProvider
} from '../../../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { SharedModule } from '../../../../../shared.module';
import { createBasicStoreModule } from '../../../../../../test-framework/store-test-helper';

describe('CfUserPermissionCellComponent', () => {
  let component: CfOrgPermissionCellComponent;
  let fixture: ComponentFixture<CfOrgPermissionCellComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      providers: [
        ...generateTestCfEndpointServiceProvider()
      ],
      imports: [
        SharedModule,
        createBasicStoreModule()
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
