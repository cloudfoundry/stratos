import { DatePipe } from '@angular/common';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';

import { CoreModule } from '../../../core/src/core/core.module';
import { ApplicationService } from '../../../core/src/features/applications/application.service';
import { SharedModule } from '../../../core/src/shared/shared.module';
import { TabNavService } from '../../../core/tab-nav.service';
import { ApplicationServiceMock } from '../../../core/test-framework/application-service-helper';
import { createEmptyStoreModule } from '../../../core/test-framework/store-test-helper';
import { AutoscalerBaseComponent } from './autoscaler-base.component';

describe('AutoscalerBaseComponent', () => {
  let component: AutoscalerBaseComponent;
  let fixture: ComponentFixture<AutoscalerBaseComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [AutoscalerBaseComponent],
      imports: [
        BrowserAnimationsModule,
        createEmptyStoreModule(),
        CoreModule,
        SharedModule,
        RouterTestingModule,
      ],
      providers: [
        DatePipe,
        { provide: ApplicationService, useClass: ApplicationServiceMock },
        TabNavService
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AutoscalerBaseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
