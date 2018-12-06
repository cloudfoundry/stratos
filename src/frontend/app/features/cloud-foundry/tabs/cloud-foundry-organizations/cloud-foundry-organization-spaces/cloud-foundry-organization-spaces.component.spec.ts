import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { CoreModule } from '../../../../../core/core.module';
import { MDAppModule } from '../../../../../core/md.module';
import { SharedModule } from '../../../../../shared/shared.module';
import { generateTestCfEndpointServiceProvider } from '../../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { CloudFoundryOrganizationServiceMock } from '../../../../../test-framework/cloud-foundry-organization.service.mock';
import { createBasicStoreModule } from '../../../../../test-framework/store-test-helper';
import { CloudFoundryOrganizationService } from '../../../services/cloud-foundry-organization.service';
import { CloudFoundryOrganizationSpacesComponent } from './cloud-foundry-organization-spaces.component';

describe('CloudFoundryOrganizationSpacesComponent', () => {
  let component: CloudFoundryOrganizationSpacesComponent;
  let fixture: ComponentFixture<CloudFoundryOrganizationSpacesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CloudFoundryOrganizationSpacesComponent],
      imports: [
        SharedModule,
        CoreModule,
        createBasicStoreModule(),
        MDAppModule,
        BrowserAnimationsModule
      ],
      providers: [
        ...generateTestCfEndpointServiceProvider(),
        { provide: CloudFoundryOrganizationService, useClass: CloudFoundryOrganizationServiceMock },
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CloudFoundryOrganizationSpacesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
