import { async, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { createBasicStoreModule } from '@stratosui/store/testing';

import { CoreTestingModule } from '../test-framework/core-test.modules';
import { AppComponent } from './app.component';
import { LoggedInService } from './logged-in.service';
import { SharedModule } from './shared/shared.module';

describe('AppComponent', () => {

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        AppComponent
      ],
      providers: [
        LoggedInService
      ],
      imports: [
        SharedModule,
        RouterTestingModule,
        CoreTestingModule,
        createBasicStoreModule(),
      ]
    }).compileComponents();
  }));

  it('should create the app', async(() => {
    const fixture = TestBed.createComponent<AppComponent>(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  }));
});
