import { CommonModule } from '@angular/common';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { ConnectionBackend, Http, HttpModule } from '@angular/http';
import { MockBackend } from '@angular/http/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { StoreModule } from '@ngrx/store';

import { CoreModule } from '../../../core/core.module';

import { CloudFoundryService } from '../../../shared/data-services/cloud-foundry.service';
import { EntityMonitorFactory } from '../../../shared/monitors/entity-monitor.factory.service';
import { InternalEventMonitorFactory } from '../../../shared/monitors/internal-event-monitor.factory';
import { PaginationMonitorFactory } from '../../../shared/monitors/pagination-monitor.factory';
import { CreateApplicationStep2Component } from './create-application-step2/create-application-step2.component';
import { CreateApplicationStep3Component } from './create-application-step3/create-application-step3.component';
import { CreateApplicationComponent } from './create-application.component';
import { appReducers } from '../../../../../store/src/reducers.module';
import { SharedModule } from '../../../shared/shared.module';
import { HttpClientModule } from '@angular/common/http';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('CreateApplicationComponent', () => {
  let component: CreateApplicationComponent;
  let fixture: ComponentFixture<CreateApplicationComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        CreateApplicationComponent,
        CreateApplicationStep2Component,
        CreateApplicationStep3Component
      ],
      imports: [
        CommonModule,
        CoreModule,
        HttpModule,
        RouterTestingModule,
        BrowserAnimationsModule,
        SharedModule,
        HttpClientModule,
        HttpClientTestingModule,
        StoreModule.forRoot(
          appReducers
        )
      ],
      providers: [
        PaginationMonitorFactory,
        EntityMonitorFactory,
        InternalEventMonitorFactory,
        CloudFoundryService
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateApplicationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
