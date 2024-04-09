import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { createBasicStoreModule } from '@stratosui/store/testing';

import { CoreTestingModule } from '../../../test-framework/core-test.modules';
import { CoreModule } from '../../core/core.module';
import { CurrentUserPermissionsService } from '../../core/permissions/current-user-permissions.service';
import { SharedModule } from '../../shared/shared.module';
import { TabNavService } from '../../tab-nav.service';
import { NoEndpointsNonAdminComponent } from './no-endpoints-non-admin.component';

describe('NoEndpointsNonAdminComponent', () => {
  let component: NoEndpointsNonAdminComponent;
  let fixture: ComponentFixture<NoEndpointsNonAdminComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [NoEndpointsNonAdminComponent],
      imports: [
        CoreModule,
        RouterTestingModule,
        SharedModule,
        CoreTestingModule,
        createBasicStoreModule(),
      ],
      providers: [
        TabNavService,
        CurrentUserPermissionsService
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NoEndpointsNonAdminComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
