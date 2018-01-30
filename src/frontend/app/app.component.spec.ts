import {
  RouterTestingModule
} from '@angular/router/testing';

import { StoreModule } from '@ngrx/store';

import { TestBed, async } from '@angular/core/testing';

import { AppComponent } from './app.component';
import { LoggedInService } from './logged-in.service';
import { CoreModule } from './core/core.module';
import { SharedModule } from './shared/shared.module';
import { createBasicStoreModule } from './test-framework/store-test-helper';

describe('AppComponent', () => {

  class LoggedInServiceMock {
  }

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        AppComponent
      ],
      providers: [
        { provide: LoggedInService, useClass: LoggedInServiceMock }
      ],
      imports: [
        // CoreModule,
        SharedModule,
        RouterTestingModule,
        createBasicStoreModule(),
      ]
    }).compileComponents();
  }));

  it('should create the app', async(() => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.debugElement.componentInstance;
    expect(app).toBeTruthy();
  }));
});
