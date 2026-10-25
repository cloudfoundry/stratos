import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Validators, FormControl } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import {
  StratosCatalogEndpointEntity,
  EntityCatalogTestModule,
  TEST_CATALOGUE_ENTITIES,
  generateStratosEntities
} from '@stratosui/store';
import { createBasicStoreModule, STORE_TEST_PROVIDERS } from '@stratosui/store/testing';
import { TailwindDialogRef, MAT_DIALOG_DATA } from '@stratosui/core';
import { AppTestModule } from '@test-framework/core-test.helper';
import { SidePanelService } from '../../../shared/services/side-panel.service';
import { ConnectEndpointComponent } from '../connect-endpoint/connect-endpoint.component';
import { ConnectEndpointConfig } from '../connect.service';
import { CredentialsAuthFormComponent } from './auth-forms/credentials-auth-form.component';
import { ConnectEndpointDialogComponent } from './connect-endpoint-dialog.component';

class TailwindDialogRefMock {
}

class DialogDataMock implements ConnectEndpointConfig {
  guid = '57ab08d8-86cc-473a-8818-25d5e8d0ea23';
  name = 'Test';
  type = 'test-endpoint';
  subType = '';
  ssoAllowed = false;
}

// Create test endpoint entity
const testEndpoint = new StratosCatalogEndpointEntity({
  type: 'test-endpoint',
  label: 'Test Endpoint',
  labelPlural: 'Test Endpoints',
  logoUrl: '',
  authTypes: [
    {
      value: 'creds',
      name: 'Username and Password',
      form: {
        username: new FormControl('', [Validators.required]),
        password: new FormControl('', [Validators.required])
          },
      types: new Array<string>(),
      component: CredentialsAuthFormComponent,
      help: '/core/assets/connect/test.md',
    }
  ],
  renderPriority: 1
});

describe('ConnectEndpointDialogComponent', () => {
  let component: ConnectEndpointDialogComponent;
  let fixture: ComponentFixture<ConnectEndpointDialogComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ...STORE_TEST_PROVIDERS,
        { provide: TailwindDialogRef, useClass: TailwindDialogRefMock },
        { provide: MAT_DIALOG_DATA, useClass: DialogDataMock },
        {
          provide: TEST_CATALOGUE_ENTITIES,
          useValue: [
            ...generateStratosEntities(),
            testEndpoint
          ]
        },
        SidePanelService,
        provideZonelessChangeDetection(),
      ],
      imports: [
        RouterTestingModule,
        NoopAnimationsModule,
        EntityCatalogTestModule,
        createBasicStoreModule(),
        AppTestModule,
        ConnectEndpointDialogComponent,
        ConnectEndpointComponent,
        CredentialsAuthFormComponent,
      ]
    });
    TestBed.compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ConnectEndpointDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  // Same header as the app's other dialogs (e.g. the Disconnect confirm),
  // and the title names the dialog for assistive technology.
  it('heads the dialog with its title, which names the dialog', async () => {
    const panel = document.createElement('div');
    panel.setAttribute('role', 'dialog');
    document.body.appendChild(panel);
    const dialogFixture = TestBed.createComponent(ConnectEndpointDialogComponent);
    panel.appendChild(dialogFixture.nativeElement);
    await dialogFixture.whenStable();

    const title = panel.querySelector('h2') as HTMLElement;
    expect(title.textContent?.trim()).toBe('Connect to Test');
    expect(title.classList).toContain('text-lg');
    expect(title.classList).toContain('font-semibold');
    expect(title.closest('[data-dialog-drag-handle]')).not.toBeNull();
    expect(title.id).toBeTruthy();
    expect(panel.getAttribute('aria-labelledby')).toBe(title.id);
    dialogFixture.destroy();
    panel.remove();
  });

  // An icon-only button: its name is all a screen reader has
  it('names the help button', async () => {
    await vi.waitFor(async () => {
      await fixture.whenStable();
      expect(fixture.nativeElement.querySelector('.connection-dialog__help')).not.toBeNull();
    });
    expect(fixture.nativeElement.querySelector('.connection-dialog__help').getAttribute('aria-label')).toBe('Help on connecting');
  });
});
