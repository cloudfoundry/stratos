import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { UsersRolesConfirmComponent } from './manage-users-confirm.component';
import { CoreModule } from '../../../../../core/core.module';
import { SharedModule } from '../../../../../shared/shared.module';
import { createBasicStoreModule } from '../../../../../test-framework/store-test-helper';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActiveRouteCfOrgSpace } from '../../../cf-page.types';
import { CfRolesService } from '../cf-roles.service';

describe('UsersRolesConfirmComponent', () => {
  let component: UsersRolesConfirmComponent;
  let fixture: ComponentFixture<UsersRolesConfirmComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        CoreModule,
        SharedModule,
        createBasicStoreModule(),
        NoopAnimationsModule
      ],
      providers: [
        ActiveRouteCfOrgSpace,
        CfRolesService
      ],
      declarations: [
        UsersRolesConfirmComponent
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(UsersRolesConfirmComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
