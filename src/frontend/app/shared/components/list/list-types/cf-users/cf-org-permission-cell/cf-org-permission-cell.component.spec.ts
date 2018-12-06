import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpModule } from '@angular/http';

import {
  generateTestCfEndpointServiceProvider,
} from '../../../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { createBasicStoreModule } from '../../../../../../test-framework/store-test-helper';
import { SharedModule } from '../../../../../shared.module';
import { CfOrgPermissionCellComponent } from './cf-org-permission-cell.component';

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
        createBasicStoreModule(),
        HttpModule
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
