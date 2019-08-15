import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpModule } from '@angular/http';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';

import { CoreModule } from '../../../../../../core/src/core/core.module';
import { SharedModule } from '../../../../../../core/src/shared/shared.module';
import { TabNavService } from '../../../../../../core/tab-nav.service';
import { createBasicStoreModule } from '../../../../../../core/test-framework/store-test-helper';
import { CfUserServiceTestProvider } from '../../../../../../core/test-framework/user-service-helper';
import { ActiveRouteCfOrgSpace } from '../../cf-page.types';
import { CfRolesService } from './cf-roles.service';
import { UsersRolesConfirmComponent } from './manage-users-confirm/manage-users-confirm.component';
import { UsersRolesModifyComponent } from './manage-users-modify/manage-users-modify.component';
import {
  SpaceRolesListWrapperComponent,
} from './manage-users-modify/space-roles-list-wrapper/space-roles-list-wrapper.component';
import { UsersRolesSelectComponent } from './manage-users-select/manage-users-select.component';
import { UsersRolesComponent } from './manage-users.component';

describe('UsersRolesComponent', () => {
  let component: UsersRolesComponent;
  let fixture: ComponentFixture<UsersRolesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        CoreModule,
        SharedModule,
        createBasicStoreModule(),
        NoopAnimationsModule,
        RouterTestingModule,
        HttpModule
      ],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParams: { breadcrumbs: 'key' },
              params: {}
            }
          }
        },
        ActiveRouteCfOrgSpace,
        CfUserServiceTestProvider,
        CfRolesService,
        TabNavService
      ],
      declarations: [
        UsersRolesComponent,
        UsersRolesSelectComponent,
        UsersRolesModifyComponent,
        UsersRolesConfirmComponent,
        SpaceRolesListWrapperComponent
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(UsersRolesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
