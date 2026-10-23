import { ChangeDetectionStrategy, Component, inject, provideZonelessChangeDetection } from '@angular/core';
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

describe('EndpointRegisterModalComponent', () => {
  let component: EndpointRegisterModalComponent;
  let fixture: ComponentFixture<EndpointRegisterModalComponent>;

  const cancelButtons = () => Array.from(fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>)
    .filter(b => b.textContent?.trim() === 'Cancel');

  const selectType = async () => {
    const tile = { label: 'Test', data: { type: 'test-registration', parentType: '' } } as ITileConfig<ICreateEndpointTilesData>;
    component.onTileSelected(tile);
    await fixture.whenStable();
    return component.componentRef!.instance as TestRegistrationComponent;
  };

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [...BaseTestModules, EndpointRegisterModalComponent],
      providers: [...STORE_TEST_PROVIDERS, provideZonelessChangeDetection()],
    });
    EntityCatalogHelpers.SetEntityCatalogHelper(TestBed.inject(EntityCatalogHelper));
    entityCatalog.register(new StratosCatalogEndpointEntity({
      type: 'test-registration', label: 'Test', labelPlural: 'Tests', logoUrl: '', authTypes: [],
      registrationComponent: TestRegistrationComponent,
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

  // The form's own stepper has the Cancel once a type is picked.
  it('shows its own Cancel only while a type is being picked', async () => {
    expect(cancelButtons().length).toBe(1);
    await selectType();
    expect(cancelButtons().length).toBe(0);
  });
});
