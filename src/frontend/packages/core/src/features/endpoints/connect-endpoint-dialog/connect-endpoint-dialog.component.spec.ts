import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { HttpTestingController } from '@angular/common/http/testing';
import { By } from '@angular/platform-browser';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Validators, FormControl } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import {
  EndpointModel,
  EndpointsDataService,
  StratosCatalogEndpointEntity,
  EntityCatalogTestModule,
  TEST_CATALOGUE_ENTITIES,
  generateStratosEntities
} from '@stratosui/store';
import { createBasicStoreModule, seedEndpointsDataService, STORE_TEST_PROVIDERS } from '@stratosui/store/testing';
import { TailwindDialogRef, MAT_DIALOG_DATA } from '@stratosui/core';
import { Subject } from 'rxjs';
import { TailwindSnackBarService } from '../../../shared/services/tailwind-snackbar.service';
import { AppTestModule, BASE_TEST_PROVIDERS } from '@test-framework/core-test.helper';
import { SidePanelService } from '../../../shared/services/side-panel.service';
import { ConfirmationDialogService } from '../../../shared/components/confirmation-dialog.service';
import { SteppersComponent } from '../../../shared/components/stepper/steppers/steppers.component';
import { EndpointCertificatesService } from '../certificates/endpoint-certificates.service';
import { ConnectEndpointComponent } from '../connect-endpoint/connect-endpoint.component';
import { ConnectEndpointConfig } from '../connect.service';
import { CreateEndpointConnectComponent } from '../create-endpoint/create-endpoint-connect/create-endpoint-connect.component';
import { EndpointPermissionsService } from '../endpoint-permissions.service';
import { EndpointsSignalConfigService } from '../endpoints-page/endpoints-signal-config.service';
import { CredentialsAuthFormComponent } from './auth-forms/credentials-auth-form.component';
import { ConnectEndpointDialogComponent } from './connect-endpoint-dialog.component';

class TailwindDialogRefMock {
  close = vi.fn();
}

const PEM = '-----BEGIN CERTIFICATE-----\nAAAA\n-----END CERTIFICATE-----';

const cfEntity = new StratosCatalogEndpointEntity({
  type: 'cf',
  label: 'Cloud Foundry',
  labelPlural: 'Cloud Foundry',
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

function cfEndpoint(over: Partial<EndpointModel> = {}): EndpointModel {
  return {
    guid: 'cf-guid',
    name: 'CF',
    cnsi_type: 'cf',
    sub_type: '',
    api_endpoint: { Scheme: 'https', Host: 'api.example.com', Path: '' },
    skip_ssl_validation: false,
    sso_allowed: false,
    system_shared_token: false,
    creator: { name: 'admin', admin: true, system: true },
    connectionStatus: 'disconnected',
    ...over,
  } as EndpointModel;
}

function configFor(ep: EndpointModel): ConnectEndpointConfig {
  return { guid: ep.guid!, name: ep.name, type: ep.cnsi_type!, subType: ep.sub_type ?? '', ssoAllowed: false };
}

describe('ConnectEndpointDialogComponent', () => {
  let component: ConnectEndpointDialogComponent;
  let fixture: ComponentFixture<ConnectEndpointDialogComponent>;
  let dialogData: ConnectEndpointConfig;
  let canManage: ReturnType<typeof vi.fn>;
  let unregister: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    dialogData = configFor(cfEndpoint());
    TestBed.configureTestingModule({
      providers: [
        ...STORE_TEST_PROVIDERS,
        ...BASE_TEST_PROVIDERS,
        { provide: TailwindDialogRef, useClass: TailwindDialogRefMock },
        { provide: MAT_DIALOG_DATA, useFactory: () => dialogData },
        {
          provide: TEST_CATALOGUE_ENTITIES,
          useValue: [
            ...generateStratosEntities(),
            cfEntity
          ]
        },
        {
          provide: EndpointCertificatesService,
          useValue: { decode: vi.fn().mockResolvedValue([]), checkTrust: vi.fn().mockResolvedValue([]) },
        },
        SidePanelService,
        provideZonelessChangeDetection(),
      ],
      imports: [
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
    seedEndpointsDataService([cfEndpoint()]);
    canManage = vi.fn().mockReturnValue(true);
    vi.spyOn(TestBed.inject(EndpointPermissionsService), 'canManage').mockImplementation(canManage as never);
    unregister = vi.fn().mockResolvedValue({ busy: false, error: false, message: '' });
    vi.spyOn(TestBed.inject(EndpointsSignalConfigService), 'unregister').mockImplementation(unregister as never);
    vi.spyOn(TestBed.inject(ConfirmationDialogService), 'openWithCancel').mockImplementation((_c, ok) => ok());
  });

  async function open() {
    fixture = TestBed.createComponent(ConnectEndpointDialogComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  }

  const steppers = () => fixture.debugElement.query(By.directive(SteppersComponent)).componentInstance as SteppersComponent;
  const connectStep = () =>
    fixture.debugElement.query(By.directive(CreateEndpointConnectComponent)).componentInstance as CreateEndpointConnectComponent;
  const q = (sel: string) => (fixture.nativeElement as HTMLElement).querySelector(sel) as HTMLElement | null;
  const text = () => (fixture.nativeElement as HTMLElement).textContent!.replace(/\s+/g, ' ');
  const close = () => TestBed.inject(TailwindDialogRef).close;

  async function previous() {
    (q('#stepper_previous') as HTMLButtonElement).click();
    await fixture.whenStable();
  }

  it('opens on Connect with Register done', async () => {
    await open();
    expect(steppers().currentIndex()).toBe(1);
    const header = q('.steppers-header button') as HTMLButtonElement;
    expect(header.getAttribute('aria-label')).toBe('Register, completed');
    expect(header.textContent).toContain('done');
    expect(text()).toContain('CF is registered.');
  });

  it('Previous shows the locked registration', async () => {
    await open();
    await previous();
    expect(steppers().currentIndex()).toBe(0);
    expect((q('#name') as HTMLInputElement).disabled).toBe(true);
    expect((q('#name') as HTMLInputElement).value).toBe('CF');
    expect(TestBed.inject(ConfirmationDialogService).openWithCancel).not.toHaveBeenCalled();
    expect(unregister).not.toHaveBeenCalled();
  });

  // Review Focus 5: a user who cannot manage the endpoint sees the
  // certificates, but no TLS controls, no PEM and no Unregister.
  it('non-manager review', async () => {
    canManage.mockReturnValue(false);
    seedEndpointsDataService([cfEndpoint({ ca_cert: PEM })]);
    await open();
    await previous();
    expect(q('#skipSSL')).toBeNull();
    expect(q('#ca-cert')).toBeNull();
    expect(q('#unregister')).toBeNull();
    expect(q('app-endpoint-certificates')).toBeTruthy();
  });

  it('closes with Unregistered after Unregister', async () => {
    const show = vi.spyOn(TestBed.inject(TailwindSnackBarService), 'show');
    await open();
    await previous();
    (q('#unregister') as HTMLButtonElement).click();
    await vi.waitFor(() => expect(close()).toHaveBeenCalled());
    expect(unregister).toHaveBeenCalledWith('cf-guid', 'cf');
    expect(show).toHaveBeenCalledWith('Unregistered CF');
  });

  // The connect step says so once; the dialog adds no copy of its own.
  it('Reconnect keeps the existing connection message', async () => {
    seedEndpointsDataService([cfEndpoint({ connectionStatus: 'connected' })]);
    await open();
    const cs = connectStep().connectService!;
    // No 1 s settle before the error shows
    (cs as unknown as { connectDelay: number }).connectDelay = 0;
    cs.setData({ authType: 'creds', authVal: { username: 'u', password: 'p' }, systemShared: false, bodyContent: '' });

    const submitted = component.connectStepHandle.submit!();
    const http = TestBed.inject(HttpTestingController);
    await vi.waitFor(() => http.expectOne(req => req.url.includes('tokens'))
      .flush({ error: 'Bad credentials' }, { status: 401, statusText: 'Unauthorized' }));
    expect(await submitted).toEqual(expect.objectContaining({ success: false }));

    const note = 'Your existing connection is unaffected and remains active.';
    await vi.waitFor(async () => {
      await fixture.whenStable();
      expect(text()).toContain(note);
    });
    expect(text().split(note).length - 1).toBe(1);
    expect(close()).not.toHaveBeenCalled();
  });

  // As before the stepper: no second connect while the first settles.
  it('keeps Connect disabled while a successful connect settles', async () => {
    vi.spyOn(TestBed.inject(EndpointsDataService), 'getAll').mockResolvedValue([]);
    await open();
    const cs = connectStep().connectService!;
    cs.setData({ authType: 'creds', authVal: { username: 'u', password: 'p' }, systemShared: false, bodyContent: '' });

    const submitted = component.connectStepHandle.submit!();
    const http = TestBed.inject(HttpTestingController);
    await vi.waitFor(() => http.expectOne(req => req.url.includes('tokens')).flush({}));
    expect(await submitted).toEqual(expect.objectContaining({ ignoreSuccess: true }));
    // Credentials as filled in, so only the settling connect disables Connect
    connectStep().validSignal.set(true);
    await fixture.whenStable();
    expect((q('#stepper_next') as HTMLButtonElement).disabled).toBe(true);

    // Nor does Enter start a second connect
    connectStep().submitted.emit();
    await fixture.whenStable();
    expect(http.match(req => req.url.includes('tokens'))).toHaveLength(0);
  });

  // Enter goes through the stepper's Connect, so its busy and error handling apply.
  it('Enter in the credentials form connects', async () => {
    await open();
    const form = fixture.debugElement.query(By.directive(ConnectEndpointComponent)).componentInstance as ConnectEndpointComponent;
    form.endpointForm.get('authValues')?.patchValue({ username: 'u', password: 'p' });
    await fixture.whenStable();

    (fixture.nativeElement.querySelector('app-connect-endpoint form') as HTMLFormElement).dispatchEvent(new Event('submit'));
    const http = TestBed.inject(HttpTestingController);
    await vi.waitFor(() => http.expectOne(req => req.url.includes('tokens')));
    expect(steppers().steps[1].busy).toBe(true);
  });

  it('git endpoint: locked fields, no certificate cards', async () => {
    const git = cfEndpoint({ guid: 'git-guid', name: 'GH', cnsi_type: 'git', sub_type: 'github' });
    seedEndpointsDataService([git]);
    dialogData = configFor(git);
    await open();
    expect(steppers().currentIndex()).toBe(1);
    await previous();
    expect((q('#name') as HTMLInputElement).disabled).toBe(true);
    expect((q('#url') as HTMLInputElement).disabled).toBe(true);
    expect(q('#skipSSL')).toBeNull();
    expect(q('#ca-cert')).toBeNull();
    expect(q('app-endpoint-certificates')).toBeNull();
    expect(q('#unregister')).toBeTruthy();
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
    expect(title.textContent?.trim()).toBe('Connect to CF');
    expect(title.classList).toContain('text-lg');
    expect(title.classList).toContain('font-semibold');
    expect(title.closest('[data-dialog-drag-handle]')).not.toBeNull();
    expect(title.id).toBeTruthy();
    expect(panel.getAttribute('aria-labelledby')).toBe(title.id);
    dialogFixture.destroy();
    panel.remove();
  });

  // One connect, one message: when the service has already said
  // "Connected to …" (with its offer), the dialog only closes.
  describe('on connect', () => {
    async function connect(reported: boolean) {
      await open();
      const show = vi.spyOn(TestBed.inject(TailwindSnackBarService), 'show');
      (connectStep().connectService as unknown as { hasConnected: Subject<boolean> }).hasConnected.next(reported);
      return { show };
    }

    it('says "Connected endpoint" and closes', async () => {
      const { show } = await connect(false);
      expect(show).toHaveBeenCalledWith("Connected endpoint 'CF'");
      expect(close()).toHaveBeenCalled();
    });

    it('only closes when the service already reported the connect', async () => {
      const { show } = await connect(true);
      expect(show).not.toHaveBeenCalled();
      expect(close()).toHaveBeenCalled();
    });
  });
});
