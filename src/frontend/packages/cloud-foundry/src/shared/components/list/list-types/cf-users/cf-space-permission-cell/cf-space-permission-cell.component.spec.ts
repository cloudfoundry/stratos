import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import {
  BaseTestModules,
  generateTestCfEndpointServiceProvider,
} from '../../../../../../../../core/test-framework/cloud-foundry-endpoint-service.helper';
import { CfSpacePermissionCellComponent } from './cf-space-permission-cell.component';

describe('CfSpacePermissionCellComponent', () => {
  let component: CfSpacePermissionCellComponent;
  let fixture: ComponentFixture<CfSpacePermissionCellComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        ...BaseTestModules
      ],
      providers: [...generateTestCfEndpointServiceProvider()]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CfSpacePermissionCellComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
