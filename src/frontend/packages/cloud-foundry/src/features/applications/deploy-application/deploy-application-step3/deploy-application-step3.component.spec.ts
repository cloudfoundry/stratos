import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';

import { CoreModule } from '../../../../../../core/src/core/core.module';
import { SharedModule } from '../../../../../../core/src/shared/shared.module';
import { generateCfStoreModules } from '../../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { CfOrgSpaceDataService } from '../../../../shared/data-services/cf-org-space-service.service';
import { DeployApplicationStep3Component } from './deploy-application-step3.component';

describe('DeployApplicationStep3Component', () => {
  let component: DeployApplicationStep3Component;
  let fixture: ComponentFixture<DeployApplicationStep3Component>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [DeployApplicationStep3Component],
      imports: [
        ...generateCfStoreModules(),
        CommonModule,
        CoreModule,
        SharedModule,
        RouterTestingModule,
        NoopAnimationsModule,
        HttpClientModule,
        HttpClientTestingModule,
      ],
      providers: [
        CfOrgSpaceDataService
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DeployApplicationStep3Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
