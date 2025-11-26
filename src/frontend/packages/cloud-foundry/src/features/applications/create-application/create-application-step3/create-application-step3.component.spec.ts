import { describe, it, expect, beforeEach } from 'vitest';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { importProvidersFrom } from '@angular/core';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { generateCfStoreModules } from '@test-framework/cf';
import { CreateApplicationStep3Component } from './create-application-step3.component';
describe('CreateApplicationStep3Component', () => {
  let component: CreateApplicationStep3Component;
  let fixture: ComponentFixture<CreateApplicationStep3Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        CreateApplicationStep3Component,
      ],
      providers: [
        provideZonelessChangeDetection(),
        provideNoopAnimations(),
        provideRouter([]),
        importProvidersFrom(...generateCfStoreModules(), HttpClientTestingModule),
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CreateApplicationStep3Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
