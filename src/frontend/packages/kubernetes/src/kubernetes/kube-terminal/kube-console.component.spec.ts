import { TemplatePortal } from '@angular/cdk/portal';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Observable, of, Subject } from 'rxjs';

import { EndpointModel } from '@stratosui/store';
import { createBasicStoreModule, STORE_TEST_PROVIDERS } from '@stratosui/store/testing';
import { TabNavService } from '@stratosui/core';
import { KubeConsoleComponent } from './kube-console.component';
import { KubernetesEndpointService } from '../services/kubernetes-endpoint.service';

// happy-dom has no canvas, so xterm cannot open a real terminal.
vi.mock('xterm', () => ({
  Terminal: class {
    loadAddon() { }
    open() { }
    onKey() { }
    onResize() { }
    focus() { }
    reset() { }
    write() { }
    dispose() { }
  }
}));
vi.mock('xterm-addon-fit', () => ({
  FitAddon: class {
    fit() { }
  }
}));

// Each subscription to the connection opens a new fake web socket.
const sockets = vi.hoisted(() => [] as { next: (v: unknown) => void, error: (e: Error) => void }[]);
vi.mock('rxjs-websockets', async () => {
  const { Subject } = await import('rxjs');
  return {
    normalClosureMessage: 'Normal closure',
    default: () => new Observable(subscriber => {
      const socket = new Subject<unknown>();
      sockets.push(socket);
      return socket.subscribe(subscriber);
    }),
  };
});

describe('KubeConsoleComponent', () => {
  let component: KubeConsoleComponent;
  let fixture: ComponentFixture<KubeConsoleComponent>;

  // The page header renders through a portal; attach it next to the
  // header so its buttons are in the fixture's DOM.
  const renderHeader = () => {
    const portal = TestBed.inject(TabNavService).pageHeader() as TemplatePortal;
    portal.viewContainerRef.createEmbeddedView(portal.templateRef, portal.context);
  };
  const text = (): string => fixture.nativeElement.textContent.replace(/\s+/g, ' ').trim();
  const button = (name: string): HTMLButtonElement | null => fixture.nativeElement.querySelector(`button[name="${name}"]`);
  const lastSocket = () => sockets[sockets.length - 1];
  // A web socket opens by sending its response function.
  const open = () => lastSocket().next(() => new Subject<string>());

  beforeEach(async () => {
    sockets.length = 0;
    const mockEndpoint: EndpointModel = {
      guid: 'test-endpoint-guid',
      name: 'Test Kubernetes Endpoint',
      connectionStatus: 'connected',
      user: {
        guid: 'test-user',
        name: 'test-user',
        admin: false
      }
    } as EndpointModel;

    const mockKubernetesEndpointService = {
      baseKube: { guid: 'test-endpoint-guid' },
      endpoint$: of({
        entity: mockEndpoint,
        metadata: {}
      })
    };

    await TestBed.configureTestingModule({
      imports: [
        KubeConsoleComponent,
        createBasicStoreModule(),
      ],
      providers: [
        ...STORE_TEST_PROVIDERS,
        TabNavService,
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideZonelessChangeDetection(),
      ],
    })
      // The component provides its own KubernetesEndpointService
      .overrideComponent(KubeConsoleComponent, {
        add: {
          providers: [{ provide: KubernetesEndpointService, useValue: mockKubernetesEndpointService }]
        }
      })
      .compileComponents();
  });

  beforeEach(async () => {
    fixture = TestBed.createComponent(KubeConsoleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    renderHeader();
    await fixture.whenStable();
  });

  afterEach(() => {
    fixture?.destroy();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('shows Disconnect instead of Connect once connected', async () => {
    expect(button('start')).not.toBeNull();
    open();
    await fixture.whenStable();
    expect(button('stop')).not.toBeNull();
    expect(button('start')).toBeNull();
  });

  it('shows the launch error on the first failed attempt', async () => {
    lastSocket().error(new Error('connection refused'));
    await fixture.whenStable();
    expect(text()).toContain('Error launching Kubernetes Terminal');
  });

  it('clears the error on reconnect and shows it again when the retry fails', async () => {
    lastSocket().error(new Error('connection refused'));
    await fixture.whenStable();

    button('start')!.click();
    await fixture.whenStable();
    expect(text()).not.toContain('Error launching Kubernetes Terminal');

    lastSocket().error(new Error('connection refused'));
    await fixture.whenStable();
    expect(text()).toContain('Error launching Kubernetes Terminal');
  });
});
