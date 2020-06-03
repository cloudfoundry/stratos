import { HttpClientModule } from '@angular/common/http';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';

import { CoreModule } from '../../../../../../core/src/core/core.module';
import { SharedModule } from '../../../../../../core/src/shared/shared.module';
import { TabNavService } from '../../../../../../core/tab-nav.service';
import { generateCfStoreModules } from '../../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { CfUserServiceTestProvider } from '../../../../../test-framework/user-service-helper';
import { ActiveRouteCfOrgSpace } from '../../cf-page.types';
import { CfRolesService } from '../manage-users//cf-roles.service';
import { UsersRolesConfirmComponent } from '../manage-users/manage-users-confirm/manage-users-confirm.component';
import { RemoveUserComponent } from './remove-user.component';

describe('RemoveUserComponent', () => {
  let component: RemoveUserComponent;
  let fixture: ComponentFixture<RemoveUserComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        ...generateCfStoreModules(),
        CoreModule,
        SharedModule,
        NoopAnimationsModule,
        RouterTestingModule,
        HttpClientModule
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
        RemoveUserComponent,
        UsersRolesConfirmComponent,
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RemoveUserComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
