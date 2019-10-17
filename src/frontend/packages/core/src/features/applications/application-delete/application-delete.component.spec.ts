import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { GetApplication } from '../../../../../store/src/actions/application.actions';
import { applicationSchemaKey, entityFactory } from '../../../../../store/src/helpers/entity-factory';
import { TabNavService } from '../../../../tab-nav.service';
import { generateTestApplicationServiceProvider } from '../../../../test-framework/application-service-helper';
import { BaseTestModules } from '../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { generateTestEntityServiceProvider } from '../../../../test-framework/entity-service.helper';
import { ApplicationsModule } from '../applications.module';
import { ApplicationDeleteComponent } from './application-delete.component';

describe('ApplicationDeleteComponent', () => {
  let component: ApplicationDeleteComponent<any>;
  let fixture: ComponentFixture<ApplicationDeleteComponent<any>>;
  const appId = '1';
  const cfId = '2';
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        ...BaseTestModules,
        ApplicationsModule
      ],
      providers: [
        generateTestEntityServiceProvider(
          appId,
          entityFactory(applicationSchemaKey),
          new GetApplication(appId, cfId)
        ),
        generateTestApplicationServiceProvider(cfId, appId),
        TabNavService
      ]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ApplicationDeleteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
