import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { generateCfBaseTestModules } from '../../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { CfUserService } from '../../../../shared/data-services/cf-user.service';
import { ActiveRouteCfOrgSpace } from '../../cf-page.types';
import { CfAdminAddUserWarningComponent } from './cf-admin-add-user-warning.component';

describe('CfAdminAddUserWarningComponent', () => {
  let component: CfAdminAddUserWarningComponent;
  let fixture: ComponentFixture<CfAdminAddUserWarningComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CfAdminAddUserWarningComponent],
      imports: generateCfBaseTestModules(),
      providers: [ActiveRouteCfOrgSpace, CfUserService]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CfAdminAddUserWarningComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
