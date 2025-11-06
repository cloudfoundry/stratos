import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute } from '@angular/router';
import { createBasicStoreModule } from '@stratosui/store/testing';

import { CoreTestingModule } from '../../../../../test-framework/core-test.modules';
import { CoreModule } from '../../../../core/core.module';
import { SharedModule } from '../../../../shared/shared.module';
import { CreateEndpointCfStep1Component } from './create-endpoint-cf-step-1.component';
import { CurrentUserPermissionsService } from '../../../../core/permissions/current-user-permissions.service';

describe('CreateEndpointCfStep1Component', () => {
  let component: CreateEndpointCfStep1Component;
  let fixture: ComponentFixture<CreateEndpointCfStep1Component>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        CoreModule,
        SharedModule,
        CoreTestingModule,
        createBasicStoreModule(),
        NoopAnimationsModule,
        CreateEndpointCfStep1Component
      ],
      providers: [{
        provide: ActivatedRoute,
        useValue: {
          snapshot: {
            queryParams: {},
            params: { type: 'cf' }
          }
        },
      },
        CurrentUserPermissionsService
      ]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateEndpointCfStep1Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  describe('URL Validation', () => {
    it('should accept valid hostnames without protocol', () => {
      const urlControl = component.registerForm.controls.urlField;

      urlControl.setValue('api.example.com');
      expect(urlControl.valid).toBe(true);
      expect(urlControl.errors).toBeNull();

      urlControl.setValue('api.sys.example.com');
      expect(urlControl.valid).toBe(true);
      expect(urlControl.errors).toBeNull();

      urlControl.setValue('my-api.example.io');
      expect(urlControl.valid).toBe(true);
      expect(urlControl.errors).toBeNull();
    });

    it('should accept valid URLs with https protocol', () => {
      const urlControl = component.registerForm.controls.urlField;

      urlControl.setValue('https://api.example.com');
      expect(urlControl.valid).toBe(true);
      expect(urlControl.errors).toBeNull();

      urlControl.setValue('https://api.sys.example.com');
      expect(urlControl.valid).toBe(true);
      expect(urlControl.errors).toBeNull();
    });

    it('should accept valid URLs with http protocol', () => {
      const urlControl = component.registerForm.controls.urlField;

      urlControl.setValue('http://api.example.com');
      expect(urlControl.valid).toBe(true);
      expect(urlControl.errors).toBeNull();
    });

    it('should accept URLs with port numbers', () => {
      const urlControl = component.registerForm.controls.urlField;

      urlControl.setValue('api.example.com:8080');
      expect(urlControl.valid).toBe(true);
      expect(urlControl.errors).toBeNull();

      urlControl.setValue('https://api.example.com:443');
      expect(urlControl.valid).toBe(true);
      expect(urlControl.errors).toBeNull();
    });

    it('should accept URLs with paths', () => {
      const urlControl = component.registerForm.controls.urlField;

      urlControl.setValue('https://api.example.com/v2/info');
      expect(urlControl.valid).toBe(true);
      expect(urlControl.errors).toBeNull();

      urlControl.setValue('api.example.com/path/to/api');
      expect(urlControl.valid).toBe(true);
      expect(urlControl.errors).toBeNull();
    });

    it('should accept IP addresses', () => {
      const urlControl = component.registerForm.controls.urlField;

      urlControl.setValue('192.168.1.1');
      expect(urlControl.valid).toBe(true);
      expect(urlControl.errors).toBeNull();

      urlControl.setValue('https://10.0.0.1:8080');
      expect(urlControl.valid).toBe(true);
      expect(urlControl.errors).toBeNull();
    });

    it('should reject invalid URLs', () => {
      const urlControl = component.registerForm.controls.urlField;

      urlControl.setValue('not a url');
      expect(urlControl.valid).toBe(false);
      expect(urlControl.errors?.invalidUrl).toBe(true);

      urlControl.setValue('ht!tp://example.com');
      expect(urlControl.valid).toBe(false);
      expect(urlControl.errors?.invalidUrl).toBe(true);

      urlControl.setValue('');
      expect(urlControl.valid).toBe(false);
      expect(urlControl.errors?.required).toBe(true);
    });

    it('should handle whitespace in URLs', () => {
      const urlControl = component.registerForm.controls.urlField;

      urlControl.setValue('  api.example.com  ');
      // Validator trims whitespace, so this should be valid
      expect(urlControl.valid).toBe(true);
      expect(urlControl.errors).toBeNull();
    });
  });

  describe('URL Normalization', () => {
    it('should have a valid form when all required fields are filled', () => {
      component.registerForm.controls.nameField.setValue('Test Endpoint');
      component.registerForm.controls.urlField.setValue('api.example.com');

      expect(component.registerForm.valid).toBe(true);
    });

    it('should trim whitespace from URL field', () => {
      const urlControl = component.registerForm.controls.urlField;
      urlControl.setValue('  api.example.com  ');

      expect(urlControl.valid).toBe(true);
    });
  });

  describe('Form Validation', () => {
    it('should require a name', () => {
      const nameControl = component.registerForm.controls.nameField;

      nameControl.setValue('');
      expect(nameControl.valid).toBe(false);
      expect(nameControl.errors?.required).toBe(true);

      nameControl.setValue('Test Endpoint');
      expect(nameControl.valid).toBe(true);
      expect(nameControl.errors).toBeNull();
    });

    it('should require a URL', () => {
      const urlControl = component.registerForm.controls.urlField;

      urlControl.setValue('');
      expect(urlControl.valid).toBe(false);
      expect(urlControl.errors?.required).toBe(true);

      urlControl.setValue('api.example.com');
      expect(urlControl.valid).toBe(true);
      expect(urlControl.errors).toBeNull();
    });

    it('should have invalid form when required fields are empty', () => {
      expect(component.registerForm.valid).toBe(false);
    });
  });
});
