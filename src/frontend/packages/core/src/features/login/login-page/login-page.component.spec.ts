import { CommonModule } from '@angular/common';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { StoreModule } from '@ngrx/store';

import { appReducers } from '../../../../../store/src/reducers.module';
import { CoreModule } from '../../../core/core.module';
import { SharedModule } from '../../../shared/shared.module';
import { LoginPageComponent } from './login-page.component';

describe('LoginPageComponent', () => {
  let component: LoginPageComponent;
  let fixture: ComponentFixture<LoginPageComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      
      imports: [
        CommonModule,
        CoreModule,
        SharedModule,
        RouterTestingModule,
        NoopAnimationsModule,
        StoreModule.forRoot(
          appReducers
        ),
        LoginPageComponent
      ]
    
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LoginPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
