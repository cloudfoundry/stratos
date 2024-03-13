import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { createBasicStoreModule } from '@stratosui/store/testing';

import { ApplicationService } from '../../../../cloud-foundry/src/features/applications/application.service';
import { ApplicationServiceMock } from '../../../../cloud-foundry/test-framework/application-service-helper';
import { CurrentUserPermissionsService } from '../../../../core/src/core/permissions/current-user-permissions.service';
import { CoreModule, SharedModule } from '../../../../core/src/public-api';
import { TabNavService } from '../../../../core/src/tab-nav.service';
import { KubeConsoleComponent } from './kube-console.component';

describe('KubeConsoleComponent', () => {
  let component: KubeConsoleComponent;
  let fixture: ComponentFixture<KubeConsoleComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [KubeConsoleComponent],
      imports: [
        CoreModule,
        SharedModule,
        RouterTestingModule,
        createBasicStoreModule()
      ],
      providers: [
        { provide: ApplicationService, useClass: ApplicationServiceMock },
        TabNavService,
        CurrentUserPermissionsService
      ],
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(KubeConsoleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
