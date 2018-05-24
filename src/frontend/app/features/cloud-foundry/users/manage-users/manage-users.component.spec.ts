import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';

import { CoreModule } from '../../../../core/core.module';
import { CfUserService } from '../../../../shared/data-services/cf-user.service';
import { SharedModule } from '../../../../shared/shared.module';
import { createBasicStoreModule } from '../../../../test-framework/store-test-helper';
import { ActiveRouteCfOrgSpace } from '../../cf-page.types';
import { CfRolesService } from './cf-roles.service';
import { UsersRolesModifyComponent } from './manage-users-modify/manage-users-modify.component';
import {
  SpaceRolesListWrapperComponent,
} from './manage-users-modify/space-roles-list-wrapper/space-roles-list-wrapper.component';
import { UsersRolesSelectComponent } from './manage-users-select/manage-users-select.component';
import { UsersRolesComponent } from './manage-users.component';
import { UsersRolesConfirmComponent } from './manage-users-confirm/manage-users-confirm.component';

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
        CfUserService,
        CfRolesService,
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
