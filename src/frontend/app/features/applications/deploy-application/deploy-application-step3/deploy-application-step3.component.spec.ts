import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';

import { CoreModule } from '../../../../core/core.module';
import { SharedModule } from '../../../../shared/shared.module';
import { createBasicStoreModule } from '../../../../test-framework/store-test-helper';
import { DeployApplicationStep3Component } from './deploy-application-step3.component';

describe('DeployApplicationStep3Component', () => {
  let component: DeployApplicationStep3Component;
  let fixture: ComponentFixture<DeployApplicationStep3Component>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DeployApplicationStep3Component ],
      imports: [
        CommonModule,
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
    fixture = TestBed.createComponent(DeployApplicationStep3Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
