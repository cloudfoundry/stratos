import { async, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { AppComponent } from './app.component';
import { LoggedInService } from './logged-in.service';
import { SharedModule } from './shared/shared.module';
import { createBasicStoreModule } from '../test-framework/store-test-helper';

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
