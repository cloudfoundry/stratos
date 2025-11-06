import { CommonModule } from '@angular/common';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { StoreModule } from '@ngrx/store';

import { appReducers } from '../../../../../store/src/reducers.module';
import { CoreModule } from '../../../core/core.module';
import { SharedModule } from '../../../public-api';
import { LogoutPageComponent } from './logout-page.component';

describe('LogoutPageComponent', () => {
  let component: LogoutPageComponent;
  let fixture: ComponentFixture<LogoutPageComponent>;

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
        LogoutPageComponent
      ]
    
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LogoutPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
