import { describe, it, expect, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import {  provideExperimentalZonelessChangeDetection, provideZonelessChangeDetection } from '@angular/core';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';

import { generateCfStoreModules } from "@test-framework/cloud-foundry-endpoint-service.helper";
import { CreateApplicationComponent } from './create-application.component';
import { CfOrgSpaceDataService } from "../../../shared/data-services/cf-org-space-service.service";
describe('CreateApplicationComponent', () => {
  let component: CreateApplicationComponent;
  let fixture: ComponentFixture<CreateApplicationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateApplicationComponent],
      providers: [
        
        provideExperimentalZonelessChangeDetection(),
        provideNoopAnimations(),
        provideRouter([,
        provideZonelessChangeDetection(),
      ]),
        ...generateCfStoreModules(),
        CfOrgSpaceDataService,
    ]
    }).compileComponents();

    fixture = TestBed.createComponent(CreateApplicationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
