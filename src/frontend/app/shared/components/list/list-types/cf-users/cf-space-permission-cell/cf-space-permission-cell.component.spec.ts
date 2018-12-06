import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CfSpacePermissionCellComponent } from './cf-space-permission-cell.component';
import {
  BaseTestModules,
  generateTestCfEndpointServiceProvider
} from '../../../../../../test-framework/cloud-foundry-endpoint-service.helper';

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
