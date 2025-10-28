import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { createBasicStoreModule } from '@stratosui/store/testing';

import { CoreTestingModule } from '../../../../test-framework/core-test.modules';
import { CoreModule } from '../../../core/core.module';
import { CurrentUserPermissionsService } from '../../../core/permissions/current-user-permissions.service';
import { SharedModule } from '../../../shared/shared.module';
import { TabNavService } from '../../../tab-nav.service';
import { DiagnosticsPageComponent } from './diagnostics-page.component';

describe('DiagnosticsPageComponent', () => {
  let component: DiagnosticsPageComponent;
  let fixture: ComponentFixture<DiagnosticsPageComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      
      imports: [
        CoreModule,
        RouterTestingModule,
        SharedModule,
        CoreTestingModule,
        createBasicStoreModule(),,
        DiagnosticsPageComponent
      ],
      providers: [
        TabNavService,
        CurrentUserPermissionsService
      ]
    
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DiagnosticsPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
