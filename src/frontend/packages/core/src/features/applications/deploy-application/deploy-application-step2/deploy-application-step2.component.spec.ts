import { CoreModule } from '../../../../core/core.module';
import { SharedModule } from '../../../../shared/shared.module';
import { inject, TestBed, ComponentFixture, async } from '@angular/core/testing';
import { Store, StoreModule } from '@ngrx/store';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { createBasicStoreModule } from '../../../../test-framework/store-test-helper';
import { RouterTestingModule } from '@angular/router/testing';
import { MatDialogModule } from '@angular/material';

import { DeployApplicationStep2Component } from './deploy-application-step2.component';
import { DeployApplicationFsComponent } from './deploy-application-fs/deploy-application-fs.component';
import { GITHUB_API_URL, getGitHubAPIURL } from '../../../../core/github.helpers';

describe('DeployApplicationStep2Component', () => {
  let component: DeployApplicationStep2Component;
  let fixture: ComponentFixture<DeployApplicationStep2Component>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        DeployApplicationStep2Component,
        DeployApplicationFsComponent
      ],
      imports: [
        CoreModule,
        SharedModule,
        RouterTestingModule,
        createBasicStoreModule(),
        BrowserAnimationsModule
      ],
      providers: [
        { provide: GITHUB_API_URL, useFactory: getGitHubAPIURL }
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DeployApplicationStep2Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
