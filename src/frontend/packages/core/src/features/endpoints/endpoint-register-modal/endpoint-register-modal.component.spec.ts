import { InteractivityChecker } from '@angular/cdk/a11y';
import { ChangeDetectionStrategy, Component, inject, input, provideZonelessChangeDetection, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EntityCatalogHelper, EntityCatalogHelpers, StratosCatalogEndpointEntity, entityCatalog } from '@stratosui/store';
import { BaseTestModules, STORE_TEST_PROVIDERS } from '@test-framework/core-test.helper';

import { ITileConfig } from '../../../shared/components/tile/tile-selector.types';
import { ICreateEndpointTilesData } from '../create-endpoint/create-endpoint-base-step/base-endpoint-tile-manager';
import { ENDPOINT_REGISTER_HANDLE } from './endpoint-register-handle';
import { EndpointRegisterModalComponent } from './endpoint-register-modal.component';

// Stands in for a type's registration form (Git, kubeconfig, ...).
@Component({
  selector: 'app-test-registration',
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class TestRegistrationComponent {
  handle = inject(ENDPOINT_REGISTER_HANDLE);
}

// Opens the dialog from a button, as the endpoints page does.
@Component({
  selector: 'app-test-opener',
  template: `
    <button id="opener" type="button" (click)="open.set(true)">Register Endpoint</button>
    @if (open()) {
      <app-endpoint-register-modal (closeModalEvent)="open.set(false)"></app-endpoint-register-modal>
    }
  `,
  imports: [EndpointRegisterModalComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class TestOpenerComponent {
  open = signal(false);
}

// Stands in for the create-endpoint form, which has its own page header.
@Component({
  selector: 'app-test-headed-registration',
  template: '@if (!hideHeader()) { <h1>Own header</h1> }<p>Form</p>',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class TestHeadedRegistrationComponent {
  readonly hideHeader = input(false);
}

describe('EndpointRegisterModalComponent', () => {
  let component: EndpointRegisterModalComponent;
  let fixture: ComponentFixture<EndpointRegisterModalComponent>;

  const cancelButtons = () => Array.from(fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>)
    .filter(b => b.textContent?.trim() === 'Cancel');

  const selectType = async (type = 'test-registration') => {
    const tile = { label: 'Test', data: { type, parentType: '' } } as ITileConfig<ICreateEndpointTilesData>;
    component.onTileSelected(tile);
    await fixture.whenStable();
    return component.componentRef!.instance as TestRegistrationComponent;
  };

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [...BaseTestModules, EndpointRegisterModalComponent],
      providers: [
        ...STORE_TEST_PROVIDERS,
        provideZonelessChangeDetection(),
        // The test DOM has no layout, so the focus trap would find nothing
        // visible, and so nothing focusable.
        {
          provide: InteractivityChecker, useValue: {
            isFocusable: (el: HTMLElement) => el.matches('button, [tabindex]'),
            isTabbable: (el: HTMLElement) => el.matches('button, [tabindex]:not([tabindex="-1"])'),
            isVisible: () => true,
            isDisabled: () => false,
          },
        },
      ],
    });
    EntityCatalogHelpers.SetEntityCatalogHelper(TestBed.inject(EntityCatalogHelper));
    entityCatalog.register(new StratosCatalogEndpointEntity({
      type: 'test-registration', label: 'Test', labelPlural: 'Tests', logoUrl: '', authTypes: [],
      registrationComponent: TestRegistrationComponent,
    }));
    entityCatalog.register(new StratosCatalogEndpointEntity({
      type: 'test-headed-registration', label: 'Headed', labelPlural: 'Headed', logoUrl: '', authTypes: [],
      registrationComponent: TestHeadedRegistrationComponent,
    }));
    fixture = TestBed.createComponent(EndpointRegisterModalComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('closes, reporting the registration, when the form says it registered an endpoint', async () => {
    const form = await selectType();
    const registered = vi.fn();
    const closed = vi.fn();
    component.endpointRegistered.subscribe(registered);
    component.closeModalEvent.subscribe(closed);

    form.handle.close(true);
    expect(registered).toHaveBeenCalledTimes(1);
    expect(closed).not.toHaveBeenCalled();
  });

  it('closes without a registration when the form is cancelled', async () => {
    const form = await selectType();
    const registered = vi.fn();
    const closed = vi.fn();
    component.endpointRegistered.subscribe(registered);
    component.closeModalEvent.subscribe(closed);

    form.handle.close(false);
    expect(closed).toHaveBeenCalledTimes(1);
    expect(registered).not.toHaveBeenCalled();
  });

  it('is a modal dialog named by its title', () => {
    const dialog = fixture.nativeElement.querySelector('[role="dialog"]') as HTMLElement;
    expect(dialog).toBeTruthy();
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    const title = dialog.querySelector(`#${dialog.getAttribute('aria-labelledby')}`);
    expect(title?.textContent?.trim()).toBe('Register Endpoint');
  });

  // The form's own stepper has the Cancel once a type is picked.
  it('shows its own Cancel only while a type is being picked', async () => {
    expect(cancelButtons().length).toBe(1);
    await selectType();
    expect(cancelButtons().length).toBe(0);
  });

  // The dialog has its own header. Setting hideHeader as a plain field
  // replaced the form's signal input, and the form rendered empty.
  it('hides the form\'s own header and still shows the form', async () => {
    await selectType('test-headed-registration');
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Form');
    expect(text).not.toContain('Own header');
  });

  describe('focus', () => {
    let host: ComponentFixture<TestOpenerComponent>;
    const opener = () => host.nativeElement.querySelector('#opener') as HTMLButtonElement;
    const dialog = () => host.nativeElement.querySelector('[role="dialog"]') as HTMLElement;

    beforeEach(async () => {
      host = TestBed.createComponent(TestOpenerComponent);
      await host.whenStable();
      opener().focus();
      opener().click();
      await host.whenStable();
    });

    it('moves into the dialog when it opens', () => {
      expect(dialog().contains(document.activeElement)).toBe(true);
    });

    it('wraps Tab and Shift+Tab within the dialog', () => {
      const buttons = Array.from(dialog().querySelectorAll('button'));
      // Tab past the last control or Shift+Tab before the first lands on
      // the guard either side of the dialog.
      (dialog().nextElementSibling as HTMLElement).focus();
      expect(document.activeElement).toBe(buttons[0]);
      (dialog().previousElementSibling as HTMLElement).focus();
      expect(document.activeElement).toBe(buttons[buttons.length - 1]);
    });

    it('returns to the opener when the dialog closes', async () => {
      dialog().querySelector('button')!.focus();
      host.componentInstance.open.set(false);
      await host.whenStable();
      expect(document.activeElement).toBe(opener());
    });
  });
});
