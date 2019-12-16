import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import {
  generateCfBaseTestModules,
  generateTestCfEndpointServiceProvider,
} from '../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { ApplicationService } from '../../../features/applications/application.service';
import {
  ApplicationEnvVarsHelper,
} from '../../../features/applications/application/application-tabs-base/tabs/build-tab/application-env-vars.service';
import { ApplicationPreviewComponent } from './application-preview.component';

describe('ApplicationPreviewComponent', () => {
  let component: ApplicationPreviewComponent;
  let fixture: ComponentFixture<ApplicationPreviewComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ApplicationPreviewComponent],
      providers: [
        ...generateTestCfEndpointServiceProvider(),
        ApplicationService,
        ApplicationEnvVarsHelper,
      ],
      imports: generateCfBaseTestModules(),
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ApplicationPreviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
