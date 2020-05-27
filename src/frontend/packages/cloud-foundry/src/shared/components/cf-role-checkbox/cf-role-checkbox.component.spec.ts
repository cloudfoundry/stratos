import { HttpClientModule } from '@angular/common/http';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { CoreModule } from '../../../../../core/src/core/core.module';
import { EntityMonitorFactory } from '../../../../../store/src/monitors/entity-monitor.factory.service';
import { PaginationMonitorFactory } from '../../../../../store/src/monitors/pagination-monitor.factory';
import { generateCfStoreModules } from '../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { CfUserServiceTestProvider } from '../../../../test-framework/user-service-helper';
import { ActiveRouteCfOrgSpace } from '../../../features/cloud-foundry/cf-page.types';
import { CfRolesService } from '../../../features/cloud-foundry/users/manage-users/cf-roles.service';
import { CfRoleCheckboxComponent } from './cf-role-checkbox.component';

describe('CfRoleCheckboxComponent', () => {
  let component: CfRoleCheckboxComponent;
  let fixture: ComponentFixture<CfRoleCheckboxComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        ...generateCfStoreModules(),
        CoreModule,
        NoopAnimationsModule,
        HttpClientModule
      ],
      providers: [
        CfUserServiceTestProvider,
        CfRolesService,
        PaginationMonitorFactory,
        ActiveRouteCfOrgSpace,
        EntityMonitorFactory
      ],
      declarations: [CfRoleCheckboxComponent]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CfRoleCheckboxComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
