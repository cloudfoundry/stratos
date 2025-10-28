import { TestBed, waitForAsync } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { createBasicStoreModule, STORE_TEST_PROVIDERS } from '@stratosui/store/testing';

import { CoreTestingModule } from '../test-framework/core-test.modules';
import { AppComponent } from './app.component';
import { CurrentUserPermissionsService } from './core/permissions/current-user-permissions.service';
import { LoggedInService } from './logged-in.service';
import { SharedModule } from './shared/shared.module';

describe('AppComponent', () => {

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [
        AppComponent
      ],
      imports: [
        SharedModule,
        RouterTestingModule,
        CoreTestingModule,
        createBasicStoreModule(),
      ],
      providers: [
        ...STORE_TEST_PROVIDERS,
        LoggedInService,
        CurrentUserPermissionsService,
      ]
    }).compileComponents();
  }));

  it('should create the app', waitForAsync(() => {
    const fixture = TestBed.createComponent<AppComponent>(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  }));
});
