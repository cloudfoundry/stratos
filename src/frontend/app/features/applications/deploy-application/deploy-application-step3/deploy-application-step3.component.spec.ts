import { CoreModule } from '../../../../core/core.module';
import { SharedModule } from '../../../../shared/shared.module';
import { inject, TestBed, ComponentFixture, async } from '@angular/core/testing';
import { Store, StoreModule } from '@ngrx/store';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { createBasicStoreModule } from '../../../../test-framework/store-test-helper';
import { RouterTestingModule } from '@angular/router/testing';
import { MatDialogModule } from '@angular/material';

import { DeployApplicationStep3Component } from './deploy-application-step3.component';
import { HttpModule, ConnectionBackend, Http } from '@angular/http';
import { MockBackend } from '@angular/http/testing';

describe('DeployApplicationStep3Component', () => {
  let component: DeployApplicationStep3Component;
  let fixture: ComponentFixture<DeployApplicationStep3Component>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DeployApplicationStep3Component ],
      imports: [
        CoreModule,
        SharedModule,
        RouterTestingModule,
        createBasicStoreModule(),
        BrowserAnimationsModule,
        HttpModule,
      ],
      providers: [
        {
          provide: ConnectionBackend,
          useClass: MockBackend,
        },
        Http
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
