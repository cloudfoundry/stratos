import { async, inject, ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { SharedModule } from '../../../shared/shared.module';
import { CfOrgSpaceDataService } from '../../../shared/data-services/cf-org-space-service.service';
import { CoreModule } from '../../../core/core.module';
import { StoreModule } from '@ngrx/store';
import { appReducers } from '../../../store/reducers.module';
import { getInitialTestStoreState } from '../../../test-framework/store-test-helper';
import { CreateApplicationModule } from '../create-application/create-application.module';
import { DeployApplicationComponent } from './deploy-application.component';
import { DeployApplicationStep2Component } from './deploy-application-step2/deploy-application-step2.component';
import { DeployApplicationStep3Component } from './deploy-application-step3/deploy-application-step3.component';
import { HttpClientModule } from '@angular/common/http';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('DeployApplicationComponent', () => {
  let component: DeployApplicationComponent;
  let fixture: ComponentFixture<DeployApplicationComponent>;
  const initialState = { ...getInitialTestStoreState() };

  beforeEach(async(() => {
    TestBed.configureTestingModule({
          declarations: [
            DeployApplicationComponent,
            DeployApplicationStep2Component,
            DeployApplicationStep3Component,
          ],
        providers: [CfOrgSpaceDataService],
        imports: [
          SharedModule,
          CoreModule,
          RouterTestingModule,
          CreateApplicationModule,
          BrowserAnimationsModule,
          StoreModule.forRoot(
            appReducers,
            {
              initialState
            }
          ),
          HttpClientModule,
          HttpClientTestingModule,
        ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DeployApplicationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
