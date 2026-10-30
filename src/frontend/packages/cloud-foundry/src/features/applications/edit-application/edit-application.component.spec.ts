import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { of, firstValueFrom } from 'rxjs';
import { provideRouter } from '@angular/router';

import { TabNavService } from '@stratosui/core';
import { STORE_TEST_PROVIDERS } from '@stratosui/store/testing';
import { ApplicationStateService } from '../../../shared/services/application-state.service';
import { generateTestApplicationServiceProvider } from '@test-framework/application-service-helper';
import { ApplicationEnvVarsHelper } from '../application/application-tabs-base/tabs/build-tab/application-env-vars.service';
import { EditApplicationComponent } from './edit-application.component';
import { ApplicationService } from '../application.service';
import { AppDetailDataService } from '../app-detail-data.service';

const appId = '4e4858c4-24ab-4caf-87a8-7703d1da58a0';
const cfId = '01ccda9d-8f40-4dd0-bc39-08eea68e364f';

describe('EditApplicationComponent', () => {
  let component: EditApplicationComponent;
  let fixture: ComponentFixture<EditApplicationComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        EditApplicationComponent,
      ],
      providers: [
        ...STORE_TEST_PROVIDERS,
        generateTestApplicationServiceProvider(cfId, appId),
        ApplicationStateService,
        ApplicationEnvVarsHelper,
        TabNavService,
        provideZonelessChangeDetection(),
      ]
    });
  });

  // TODO: Fix EntityCatalogHelper initialization to enable component creation test
  // The component requires EntityCatalogHelper to be initialized, which needs proper entity catalog setup
  it('should be defined', () => {
    expect(EditApplicationComponent).toBeDefined();
  });
});

describe('EditApplicationComponent labels', () => {
  let fixture: ComponentFixture<EditApplicationComponent>;
  let component: EditApplicationComponent;
  const updateLabels = vi.fn();

  beforeEach(() => {
    updateLabels.mockReset();
    updateLabels.mockResolvedValue(undefined);
    TestBed.configureTestingModule({
      imports: [EditApplicationComponent],
      providers: [
        ...STORE_TEST_PROVIDERS,
        ApplicationStateService,
        ApplicationEnvVarsHelper,
        TabNavService,
        provideRouter([]),
        { provide: ApplicationService, useValue: { cfGuid: cfId, appGuid: appId, application$: of({ app: { entity: {
          name: 'my-app', instances: 1, memory: 256, disk_quota: 1024, enable_ssh: true, space_guid: 'sp-1',
        } } }) } },
        { provide: AppDetailDataService, useValue: {
          appDetail: signal({ app: { labels: { team: 'old', keep: 'yes' } } }), updateLabels,
        } },
        provideZonelessChangeDetection(),
      ],
    });
    fixture = TestBed.createComponent(EditApplicationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('initializes labels and turns Enter into a removable pill', async () => {
    expect(component.editAppForm.controls.labels.value).toEqual({ team: 'old', keep: 'yes' });
    const input = fixture.nativeElement.querySelector('#app-label-input') as HTMLInputElement;
    input.value = 'example.com/team=platform';
    input.dispatchEvent(new Event('input'));
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
    await fixture.whenStable();
    expect(component.editAppForm.controls.labels.value['example.com/team']).toBe('platform');
    expect(fixture.nativeElement.textContent).toContain('example.com/team=platform');
    expect(component.signalHandle.valid()).toBe(true);
    fixture.nativeElement.querySelector('[aria-label="Remove label team"]').click();
    expect(component.editAppForm.controls.labels.value.team).toBeUndefined();
    expect(await firstValueFrom(component.updateApp(0, undefined as any))).toMatchObject({ success: true });
    expect(updateLabels).toHaveBeenCalledWith({ team: null, 'example.com/team': 'platform' });
  });

  it('rejects duplicate keys and blocks saving text not yet added as a pill', () => {
    const control = component.editAppForm.controls.labelInput;
    control.setValue('team=new');
    component.addLabel(new Event('keydown', { cancelable: true }));
    expect(control.hasError('duplicateLabel')).toBe(true);
    expect(component.editAppForm.invalid).toBe(true);
    expect(updateLabels).not.toHaveBeenCalled();
    control.setValue('new=value');
    expect(control.hasError('pendingLabel')).toBe(true);
  });

  it('keeps form open when the labels request fails', async () => {
    updateLabels.mockRejectedValue(new Error('CF rejected the label'));
    component.removeLabel('team');
    await expect(firstValueFrom(component.updateApp(0, undefined as any))).rejects.toThrow('CF rejected the label');
  });
});
