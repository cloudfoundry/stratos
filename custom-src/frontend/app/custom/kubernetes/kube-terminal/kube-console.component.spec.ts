import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { createBasicStoreModule } from '@stratosui/store/testing';

import { ApplicationService } from '../../../../../cloud-foundry/src/features/applications/application.service';
import { ApplicationServiceMock } from '../../../../../cloud-foundry/test-framework/application-service-helper';
import { TabNavService } from '../../../../tab-nav.service';
import { CoreModule } from '../../../core/core.module';
import { SharedModule } from '../../../shared/shared.module';
import { KubeConsoleComponent } from './kube-console.component';

describe('KubeConsoleComponent', () => {
  let component: KubeConsoleComponent;
  let fixture: ComponentFixture<KubeConsoleComponent>;

  beforeEach(async(() => {
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
        TabNavService
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
