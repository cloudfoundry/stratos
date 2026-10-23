import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { ENDPOINT_REGISTER_HANDLE } from '../../../../core/src/features/endpoints/endpoint-register-modal/endpoint-register-handle';

import { KubernetesBaseTestModules } from '../kubernetes.testing.module';
import { KubeConfigImportComponent } from './kube-config-import/kube-config-import.component';
import { KubeConfigRegistrationComponent } from './kube-config-registration.component';
import { KubeConfigSelectionComponent } from './kube-config-selection/kube-config-selection.component';

describe('KubeConfigRegistrationComponent', () => {
  let component: KubeConfigRegistrationComponent;
  let fixture: ComponentFixture<KubeConfigRegistrationComponent>;
  let registerHandle: { close: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    registerHandle = { close: vi.fn() };
    await TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        // Rendered inside the Register Endpoint dialog
        { provide: ENDPOINT_REGISTER_HANDLE, useValue: registerHandle },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              params: { endpointId: 'test' },
              queryParams: {}
            }
          }
        }
      ],
      imports: [
        ...KubernetesBaseTestModules,

        KubeConfigRegistrationComponent,
        KubeConfigSelectionComponent,
        KubeConfigImportComponent,
      ]}).compileComponents();
  });

  beforeEach(async () => {
    fixture = TestBed.createComponent(KubeConfigRegistrationComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // Inside the Register Endpoint dialog the form closes the dialog through
  // its handle instead of navigating to the page under it. Close after an
  // import reports no registration: the rows show what each import did.
  it('closes the dialog on Cancel', async () => {
    (fixture.nativeElement.querySelector('#stepper_cancel') as HTMLButtonElement).click();
    await fixture.whenStable();
    expect(registerHandle.close).toHaveBeenCalledWith(false);
  });

  it('closes the dialog on Close after the import', async () => {
    component.importerRef = { onNext: () => of({ success: true, redirect: true }), busy$: of(false) } as never;
    await component.reviewStepHandle.submit!();
    expect(registerHandle.close).toHaveBeenCalledWith(false);
  });
});
