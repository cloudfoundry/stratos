import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DeployApplicationStepSourceUploadComponent } from './deploy-application-step-source-upload.component';
import { SharedModule } from '../../../../shared/shared.module';
import { CoreModule } from '../../../../core/core.module';
import { RouterTestingModule } from '@angular/router/testing';
import { createBasicStoreModule } from '../../../../test-framework/store-test-helper';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule } from '@angular/common/http';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('DeployApplicationStepSourceUploadComponent', () => {
  let component: DeployApplicationStepSourceUploadComponent;
  let fixture: ComponentFixture<DeployApplicationStepSourceUploadComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DeployApplicationStepSourceUploadComponent ],
      imports: [
        CoreModule,
        SharedModule,
        RouterTestingModule,
        createBasicStoreModule(),
        BrowserAnimationsModule,
        HttpClientModule,
        HttpClientTestingModule,
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DeployApplicationStepSourceUploadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
