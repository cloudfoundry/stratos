import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { CoreModule } from '../../../../../../../core/src/core/core.module';
import { EntityMonitorFactory } from '@stratosui/store/monitors/entity-monitor.factory.service';
import { SharedModule } from '../../../../../../../core/src/shared/shared.module';
import { generateCfStoreModules } from "@test-framework/cloud-foundry-endpoint-service.helper";
import { CfUserService } from '../../../../../shared/data-services/cf-user.service';
import { ActiveRouteCfOrgSpace } from '../../../cf-page.types';
import { CfRolesService } from '../cf-roles.service';
import { UsersRolesModifyComponent } from './manage-users-modify.component';
import { SpaceRolesListWrapperComponent } from './space-roles-list-wrapper/space-roles-list-wrapper.component';
import { HttpClientModule } from '@angular/common/http';
import { EntityServiceFactory } from "@stratosui/store/entity-service-factory.service";
describe('UsersRolesModifyComponent', () => {
  let component: UsersRolesModifyComponent;
  let fixture: ComponentFixture<UsersRolesModifyComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        UsersRolesModifyComponent,
        SpaceRolesListWrapperComponent,
        ...generateCfStoreModules(),
        CoreModule,
        SharedModule,
        NoopAnimationsModule,
        HttpClientModule,
      ],
      providers: [
        EntityServiceFactory,
        
        ActiveRouteCfOrgSpace,
        CfRolesService,
        EntityMonitorFactory,
        CfUserService,

        provideZonelessChangeDetection(),
      ],
      
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(UsersRolesModifyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
