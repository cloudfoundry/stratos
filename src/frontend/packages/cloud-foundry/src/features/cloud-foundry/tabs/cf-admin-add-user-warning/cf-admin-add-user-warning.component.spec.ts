import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BaseTestModules } from '../../../../../../core/test-framework/cloud-foundry-endpoint-service.helper';
import { ActiveRouteCfOrgSpace } from '../../cf-page.types';
import { CfAdminAddUserWarningComponent } from './cf-admin-add-user-warning.component';

describe('CfAdminAddUserWarningComponent', () => {
  let component: CfAdminAddUserWarningComponent;
  let fixture: ComponentFixture<CfAdminAddUserWarningComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CfAdminAddUserWarningComponent],
      imports: [...BaseTestModules],
      providers: [ActiveRouteCfOrgSpace]
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
