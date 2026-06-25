import { provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, TailwindDialogRef } from '@stratosui/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ServiceCatalogDataService } from '../../../services/endpoint-data/service-catalog-data.service';
import type { StServicePlan } from '../../../services/endpoint-data/stratos-types';
import { PlanParametersPreviewDialogComponent } from './plan-parameters-preview-dialog.component';

function make(source: { value?: StServicePlan | null; isLoading?: boolean; error?: unknown }) {
  const close = vi.fn();
  const servicePlan = vi.fn().mockReturnValue({
    value: signal(source.value ?? null),
    isLoading: signal(source.isLoading ?? false),
    error: signal(source.error ?? null),
  });
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [
      provideZonelessChangeDetection(),
      { provide: MAT_DIALOG_DATA, useValue: { cnsiGuid: 'cnsi-1', planGuid: 'plan-1', planName: 'free' } },
      { provide: TailwindDialogRef, useValue: { close } },
      { provide: ServiceCatalogDataService, useValue: { servicePlan } },
    ],
  });
  const fixture = TestBed.createComponent(PlanParametersPreviewDialogComponent);
  return { cmp: fixture.componentInstance, close, servicePlan };
}

const planWith = (parameters: object): StServicePlan =>
  ({ schemas: { serviceInstance: { create: { parameters } } } } as unknown as StServicePlan);

describe('PlanParametersPreviewDialogComponent', () => {
  beforeEach(() => TestBed.resetTestingModule());

  it('fetches the named plan at details tier and titles the dialog', () => {
    const { cmp, servicePlan } = make({});
    expect(servicePlan).toHaveBeenCalledWith('cnsi-1', 'plan-1');
    expect(cmp.title).toContain('free');
  });

  it('exposes the cleaned create-parameters schema', () => {
    const { cmp } = make({ value: planWith({ $schema: 'x', properties: { region: { type: 'string' } } }) });
    expect(cmp.schema()).toEqual({ properties: { region: { type: 'string' } } });
  });

  it('reports no schema for a plan without configurable parameters', () => {
    const { cmp } = make({ value: planWith({}) });
    expect(cmp.schema()).toBeNull();
  });

  it('surfaces loading and error states', () => {
    expect(make({ isLoading: true }).cmp.loading()).toBe(true);
    expect(make({ error: new Error('boom') }).cmp.error()).toBe(true);
  });

  it('closes via the dialog ref', () => {
    const { cmp, close } = make({});
    cmp.close();
    expect(close).toHaveBeenCalled();
  });
});
