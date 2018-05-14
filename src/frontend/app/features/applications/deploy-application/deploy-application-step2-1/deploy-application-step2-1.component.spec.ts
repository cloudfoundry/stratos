import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DeployApplicationStep21Component } from './deploy-application-step2-1.component';
import { DeployApplicationModule } from '../deploy-application.module';
import { CoreModule } from '../../../../core/core.module';
import { CommitListWrapperComponent } from './commit-list-wrapper/commit-list-wrapper.component';
import { SharedModule } from '../../../../shared/shared.module';
import { createBasicStoreModule } from '../../../../test-framework/store-test-helper';

describe('DeployApplicationStep21Component', () => {
  let component: DeployApplicationStep21Component;
  let fixture: ComponentFixture<DeployApplicationStep21Component>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        DeployApplicationStep21Component,
        CommitListWrapperComponent
      ],
      imports: [
        CoreModule,
        SharedModule,
        createBasicStoreModule()
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DeployApplicationStep21Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
