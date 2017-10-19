import {
  RouterTestingModule
} from '@angular/router/testing';

import { StoreModule } from '@ngrx/store';

import { TestBed, async } from '@angular/core/testing';

import { AppComponent } from './app.component';
import { LoggedInService } from './logged-in.service';
import { CoreModule } from './core/core.module';
import { SharedModule } from './shared/shared.module';
import { appReducers } from './store/reducers.module';
import { getInitialTestStoreState } from './test-framework/store-test-helper';

fdescribe('AppComponent', () => {
  const initialState = getInitialTestStoreState();

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        AppComponent
      ],
      providers: [LoggedInService],
      imports: [
        // CoreModule,
        SharedModule,
        RouterTestingModule,
        StoreModule.forRoot(appReducers,
          {
            initialState
          })
      ]
    }).compileComponents();
  }));

  it('should create the app', async(() => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.debugElement.componentInstance;
    expect(app).toBeTruthy();
  }));
});
