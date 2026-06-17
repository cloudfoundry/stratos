import { provideZonelessChangeDetection, signal, WritableSignal } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';

import { ServiceKeysComponent } from './service-keys.component';
import { ServiceCatalogDataService, ServiceKeyView } from '../../../services/endpoint-data/service-catalog-data.service';

// SignalSource triple with a static value — null instance ⇒ the component
// builds without firing the offering/bindable fetch.
function source<T>(value: T) {
  return {
    value: signal(value).asReadonly(),
    isLoading: signal(false).asReadonly(),
    error: signal(null).asReadonly(),
  };
}

const spinner = (el: HTMLElement) => el.querySelector('.animate-spin');

describe('ServiceKeysComponent — busy-state spinners', () => {
  let component: ServiceKeysComponent;
  let fixture: ComponentFixture<ServiceKeysComponent>;
  let keysVal: WritableSignal<ServiceKeyView[]>;
  let keysLoading: WritableSignal<boolean>;

  beforeEach(async () => {
    keysVal = signal<ServiceKeyView[]>([]);
    keysLoading = signal(false);

    await TestBed.configureTestingModule({
      imports: [ServiceKeysComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        provideNoopAnimations(),
        {
          provide: ServiceCatalogDataService,
          useValue: {
            serviceInstance: () => source(null),
            // Backed by the writable signals above so tests can drive the
            // list value + loading flag through the component's source.
            serviceKeysForInstance: () => ({
              value: keysVal.asReadonly(),
              isLoading: keysLoading.asReadonly(),
              error: signal(null).asReadonly(),
            }),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ServiceKeysComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('no spinner when idle', () => {
    expect(spinner(fixture.nativeElement)).toBeNull();
  });

  it('shows a spinner while the key list is loading (GET)', () => {
    keysLoading.set(true);
    fixture.detectChanges();
    expect(spinner(fixture.nativeElement)).not.toBeNull();

    keysLoading.set(false);
    fixture.detectChanges();
    expect(spinner(fixture.nativeElement)).toBeNull();
  });

  it('shows a spinner in the create form while creating', () => {
    component.isAdding.set(true);
    fixture.detectChanges();
    expect(spinner(fixture.nativeElement)).toBeNull();

    component.creating.set(true);
    fixture.detectChanges();
    expect(spinner(fixture.nativeElement)).not.toBeNull();

    component.creating.set(false);
    fixture.detectChanges();
    expect(spinner(fixture.nativeElement)).toBeNull();
  });

  it('shows a spinner while a key\'s credentials are loading (GET)', () => {
    keysVal.set([{ guid: 'k1', name: 'key-one', createdAt: '' }]);
    fixture.detectChanges();
    expect(spinner(fixture.nativeElement)).toBeNull();

    // Expanding triggers the lazy credential GET; the request stays pending
    // under HttpTestingController, so credsLoading('k1') stays true.
    component.toggleOpen('k1');
    fixture.detectChanges();
    expect(spinner(fixture.nativeElement)).not.toBeNull();
  });

  it('shows a spinner on the delete action while deleting', () => {
    keysVal.set([{ guid: 'k1', name: 'key-one', createdAt: '' }]);
    fixture.detectChanges();
    expect(spinner(fixture.nativeElement)).toBeNull();

    // Fire-and-forget: the DELETE stays pending, rowStatus('k1') === 'busy'.
    void component.deleteKey('k1');
    fixture.detectChanges();
    expect(spinner(fixture.nativeElement)).not.toBeNull();
  });
});
