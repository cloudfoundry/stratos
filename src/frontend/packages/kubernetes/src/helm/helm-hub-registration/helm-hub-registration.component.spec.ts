import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';

import { EndpointsService } from '../../../../core/src/core/endpoints.service';
import { UserService } from '../../../../core/src/core/user.service';
import { BaseTestModules } from '../../../../core/test-framework/core-test.helper';
import { HelmHubRegistrationComponent } from './helm-hub-registration.component';

describe('HelmHubRegistrationComponent', () => {
  let component: HelmHubRegistrationComponent;
  let fixture: ComponentFixture<HelmHubRegistrationComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        ...BaseTestModules,
        HelmHubRegistrationComponent
      ],
      providers: [
        
        EndpointsService,
        UserService
      ,
        provideZonelessChangeDetection()
      ]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(HelmHubRegistrationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
