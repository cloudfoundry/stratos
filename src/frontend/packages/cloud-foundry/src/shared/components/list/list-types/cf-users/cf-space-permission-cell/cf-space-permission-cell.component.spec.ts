import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import {
  generateCfBaseTestModules,
  generateTestCfEndpointServiceProvider,
} from '../../../../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { CfSpacePermissionCellComponent } from './cf-space-permission-cell.component';

describe('CfSpacePermissionCellComponent', () => {
  let component: CfSpacePermissionCellComponent;
  let fixture: ComponentFixture<CfSpacePermissionCellComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [CfSpacePermissionCellComponent],
      imports: generateCfBaseTestModules(),
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
