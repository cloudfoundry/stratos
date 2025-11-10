import { describe, it, expect, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';

import { generateCfStoreModules } from "@test-framework/cloud-foundry-endpoint-service.helper";
import { DeployApplicationFsComponent } from "./deploy-application-fs.component";

describe('DeployApplicationFsComponent', () => {
  let component: DeployApplicationFsComponent;
  let fixture: ComponentFixture<DeployApplicationFsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        DeployApplicationFsComponent,
        ...generateCfStoreModules(),
      ],
      providers: [
        provideZonelessChangeDetection(),
        provideNoopAnimations(),
        provideRouter([]),
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DeployApplicationFsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
