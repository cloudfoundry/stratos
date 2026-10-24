import { describe, it, expect, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';

import { ApplicationEnvVarsHelper } from '../../application/application-tabs-base/tabs/build-tab/application-env-vars.service';
import { CfDeployAppDataService } from '../../../../services/domain-data/cf-deploy-app-data.service';
import { DEPLOY_TYPES_IDS } from '../deploy-application-steps.types';
import { DeployApplicationOptionsStepComponent } from './deploy-application-options-step.component';

describe('DeployApplicationOptionsStepComponent', () => {
  let component: DeployApplicationOptionsStepComponent;
  let fixture: ComponentFixture<DeployApplicationOptionsStepComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        DeployApplicationOptionsStepComponent,
      ],
      providers: [
        provideZonelessChangeDetection(),
        provideNoopAnimations(),
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        ApplicationEnvVarsHelper,
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DeployApplicationOptionsStepComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('clears a stale random_route value when no_route is checked', () => {
    const c = component.deployOptionsForm.controls;
    // Seed a random_route value without firing exclusivity (e.g. preseeded
    // from overrides) so it would otherwise leak into the cf push command.
    c.random_route.setValue(true, { emitEvent: false });

    c.no_route.setValue(true);

    expect(c.random_route.value).toBe(false); // cleared, not stale
    expect(c.random_route.disabled).toBe(true);
    const overrides = component.formToObj(c);
    expect(overrides.noRoute).toBe(true);
    expect(overrides.randomRoute).toBe(false); // CF rejects --no-route with --random-route
  });

  it('keeps no_route and random_route mutually exclusive (two-way)', () => {
    const c = component.deployOptionsForm.controls;

    c.random_route.setValue(true);
    expect(c.no_route.disabled).toBe(true);

    c.random_route.setValue(false);
    expect(c.no_route.disabled).toBe(false);

    c.no_route.setValue(true);
    expect(c.random_route.disabled).toBe(true);
  });

  it('names every text field and drop-down with a visible label', async () => {
    TestBed.inject(CfDeployAppDataService).setSourceType({ id: DEPLOY_TYPES_IDS.GIT_URL, name: 'Git URL' });
    fixture.detectChanges();
    await fixture.whenStable();

    const root: HTMLElement = fixture.nativeElement;
    const fields = Array.from(root.querySelectorAll<HTMLInputElement | HTMLSelectElement>(
      'input:not([type="checkbox"]), select'));
    expect(fields.length).toBe(14);
    for (const field of fields) {
      const name = field.getAttribute('formControlName');
      expect(field.id, `${name} has an id`).not.toBe('');
      const label = root.querySelector(`label[for="${field.id}"]`);
      expect(label?.textContent?.trim(), `${name} is labelled`).toBeTruthy();
      if (field instanceof HTMLInputElement) {
        expect(label?.textContent?.trim()).toBe(field.placeholder);
      }
    }
  });
});
