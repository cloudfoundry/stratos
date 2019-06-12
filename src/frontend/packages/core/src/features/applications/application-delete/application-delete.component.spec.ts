import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { applicationEntityType, cfEntityFactory } from '../../../../../cloud-foundry/src/cf-entity-factory';
import { GetApplication } from '../../../../../store/src/actions/application.actions';
import { TabNavService } from '../../../../tab-nav.service';
import { generateTestApplicationServiceProvider } from '../../../../test-framework/application-service-helper';
import { BaseTestModules } from '../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { generateTestEntityServiceProvider } from '../../../../test-framework/entity-service.helper';
import { ApplicationsModule } from '../applications.module';
import { CustomImportModule } from './../../../custom-import.module';
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
          cfEntityFactory(applicationEntityType),
          new GetApplication(appId, cfId)
        ),
        generateTestApplicationServiceProvider(cfId, appId),
        TabNavService
      ]
    }).overrideModule(ApplicationsModule, {
      remove: {
        imports: [CustomImportModule]
      }
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
