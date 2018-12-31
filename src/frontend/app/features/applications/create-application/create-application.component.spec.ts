import { CommonModule } from '@angular/common';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { ConnectionBackend, Http, HttpModule } from '@angular/http';
import { MockBackend } from '@angular/http/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { StoreModule } from '@ngrx/store';

import { CoreModule } from '../../../core/core.module';
import {
  CreateApplicationStep1Component,
} from '../../../shared/components/create-application/create-application-step1/create-application-step1.component';
import { FocusDirective } from '../../../shared/components/focus.directive';
import { PageHeaderModule } from '../../../shared/components/page-header/page-header.module';
import { StatefulIconComponent } from '../../../shared/components/stateful-icon/stateful-icon.component';
import { SteppersModule } from '../../../shared/components/stepper/steppers.module';
import { CloudFoundryService } from '../../../shared/data-services/cloud-foundry.service';
import { EntityMonitorFactory } from '../../../shared/monitors/entity-monitor.factory.service';
import { InternalEventMonitorFactory } from '../../../shared/monitors/internal-event-monitor.factory';
import { PaginationMonitorFactory } from '../../../shared/monitors/pagination-monitor.factory';
import { appReducers } from '../../../store/reducers.module';
import { AppNameUniqueDirective } from '../app-name-unique.directive/app-name-unique.directive';
import { CreateApplicationStep2Component } from './create-application-step2/create-application-step2.component';
import { CreateApplicationStep3Component } from './create-application-step3/create-application-step3.component';
import { CreateApplicationComponent } from './create-application.component';

describe('CreateApplicationComponent', () => {
  let component: CreateApplicationComponent;
  let fixture: ComponentFixture<CreateApplicationComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        CreateApplicationComponent,
        CreateApplicationStep1Component,
        CreateApplicationStep2Component,
        CreateApplicationStep3Component,
        AppNameUniqueDirective,
        StatefulIconComponent,
        FocusDirective
      ],
      imports: [
        CommonModule,
        CoreModule,
        HttpModule,
        RouterTestingModule,
        BrowserAnimationsModule,
        PageHeaderModule,
        SteppersModule,
        StoreModule.forRoot(
          appReducers
        )
      ],
      providers: [
        Http,
        {
          provide: ConnectionBackend,
          useClass: MockBackend
        },
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
