import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { ConnectionBackend, Http, HttpModule } from '@angular/http';
import { MockBackend } from '@angular/http/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { StoreModule } from '@ngrx/store';

import { appReducers } from '../../../../../store/src/reducers.module';
import { TabNavService } from '../../../../tab-nav.service';
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
import { CreateReleaseComponent } from './create-release.component';

describe('CreateReleaseComponent', () => {
  let component: CreateReleaseComponent;
  let fixture: ComponentFixture<CreateReleaseComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        CreateReleaseComponent,
        CreateApplicationStep1Component,
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
        ),
        HttpClientModule,
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
        CloudFoundryService,
        TabNavService
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateReleaseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
