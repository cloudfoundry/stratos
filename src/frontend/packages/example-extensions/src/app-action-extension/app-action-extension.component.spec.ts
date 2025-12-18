import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { RouterTestingModule } from '@angular/router/testing';
import { createBasicStoreModule } from "../../core/test-framework/core-test.helper";

import { CoreModule } from '../../core/core.module';
import { SharedModule } from '../../shared/shared.module';
import { AppActionExtensionComponent } from './app-action-extension.component';

describe('AppActionExtensionComponent', () => {
  let component: AppActionExtensionComponent;
  let fixture: ComponentFixture<AppActionExtensionComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
      declarations: [ AppActionExtensionComponent ],
      imports: [
        CoreModule,
        RouterTestingModule,
        SharedModule,
        createBasicStoreModule(),
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AppActionExtensionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
