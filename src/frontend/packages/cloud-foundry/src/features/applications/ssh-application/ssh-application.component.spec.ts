import { TemplatePortal } from '@angular/cdk/portal';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Observable, of, Subject } from 'rxjs';
import { TabNavService } from '@stratosui/core';
import { STORE_TEST_PROVIDERS } from '@stratosui/store/testing';
import { ApplicationService } from '../application.service';
import { SshApplicationComponent } from "./ssh-application.component";

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

describe('SshApplicationComponent', () => {
  let component: SshApplicationComponent;
  let fixture: ComponentFixture<SshApplicationComponent>;

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
    TestBed.configureTestingModule({
      imports: [
        SshApplicationComponent,
      ],
      providers: [
        ...STORE_TEST_PROVIDERS,
        {
          provide: ApplicationService,
          useValue: {
            cfGuid: 'cf-guid',
            appGuid: 'app-guid',
            waitForAppEntity$: of({ entity: { entity: { name: 'test-app' } } }),
          }
        },
        TabNavService,
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { params: { index: '0' } } } },
        provideZonelessChangeDetection(),
      ],
    });
    fixture = TestBed.createComponent(SshApplicationComponent);
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

  it('shows the web socket error on the first failed attempt', async () => {
    lastSocket().error(new Error('connection refused'));
    await fixture.whenStable();
    expect(text()).toContain('Error connecting to web socket');
  });

  it('clears the error on reconnect and shows it again when the retry fails', async () => {
    lastSocket().error(new Error('connection refused'));
    await fixture.whenStable();

    button('start')!.click();
    await fixture.whenStable();
    expect(text()).not.toContain('Error connecting to web socket');

    lastSocket().error(new Error('connection refused'));
    await fixture.whenStable();
    expect(text()).toContain('Error connecting to web socket');
  });
});
