import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpModule } from '@angular/http';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { CoreModule } from '../../../../../core/core.module';
import { SharedModule } from '../../../../../shared/shared.module';
import { createBasicStoreModule } from '../../../../../test-framework/store-test-helper';
import { ActiveRouteCfOrgSpace } from '../../../cf-page.types';
import { CfRolesService } from '../cf-roles.service';
import { UsersRolesSelectComponent } from './manage-users-select.component';


describe('UsersRolesSelectComponent', () => {
  let component: UsersRolesSelectComponent;
  let fixture: ComponentFixture<UsersRolesSelectComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        CoreModule,
        SharedModule,
        createBasicStoreModule(),
        NoopAnimationsModule,
        HttpModule
      ],
      providers: [
        ActiveRouteCfOrgSpace,
        CfRolesService
      ],
      declarations: [UsersRolesSelectComponent]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(UsersRolesSelectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
