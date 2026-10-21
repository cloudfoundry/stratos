import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { Observable, Subject, Subscription } from 'rxjs';

import { TabNavService } from '@stratosui/core';
import { generateTestApplicationServiceProvider, generateCfStoreModules, ApplicationStateService, ApplicationEnvVarsHelper } from '@test-framework/cf';
import { ApplicationService } from '../../../../application.service';
import { LogStreamTabComponent } from './log-stream-tab.component';

// Each subscription to the log stream opens a new fake web socket. `closed`
// records whether the component has since unsubscribed from it.
interface FakeSocket {
  socket: Subject<unknown>;
  closed: boolean;
}
const sockets = vi.hoisted(() => [] as FakeSocket[]);
vi.mock('rxjs-websockets', async () => {
  const { Subject } = await import('rxjs');
  return {
    normalClosureMessage: 'Normal closure',
    default: () => new Observable(subscriber => {
      const fake: FakeSocket = { socket: new Subject<unknown>(), closed: false };
      sockets.push(fake);
      const sub = fake.socket.subscribe(subscriber);
      return () => {
        fake.closed = true;
        sub.unsubscribe();
      };
    }),
  };
});

describe('LogStreamTabComponent', () => {
  let component: LogStreamTabComponent;
  let fixture: ComponentFixture<LogStreamTabComponent>;

  const appId = '';
  const cfId = '2';
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        LogStreamTabComponent,
        ...generateCfStoreModules(),
        HttpClientTestingModule,
      ],
      providers: [
        generateTestApplicationServiceProvider(cfId, appId),
        ApplicationStateService,
        ApplicationEnvVarsHelper,
        TabNavService,
        provideZonelessChangeDetection(),
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LogStreamTabComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});

describe('LogStreamTabComponent reconnection', () => {
  let component: LogStreamTabComponent;
  let subs: Subscription[];
  let lastStatus: number | undefined;

  const socket = (i: number) => sockets[i].socket;
  // A web socket opens by sending its response function.
  const connect = (i: number) => socket(i).next(() => new Subject<string>());
  const fail = (i: number) => socket(i).error(new Error('connection lost'));

  beforeEach(async () => {
    sockets.length = 0;
    TestBed.configureTestingModule({
      imports: [LogStreamTabComponent],
      providers: [
        { provide: ApplicationService, useValue: { cfGuid: 'cf-1', appGuid: 'app-1' } },
        provideZonelessChangeDetection(),
      ]
    });
    // Render nothing: the specs subscribe to the streams the way the log
    // viewer does, so every socket below is one the component opened.
    TestBed.overrideComponent(LogStreamTabComponent, { set: { template: '', imports: [] } });
    const fixture = TestBed.createComponent(LogStreamTabComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();

    vi.spyOn(console, 'log').mockImplementation(() => { });
    vi.spyOn(console, 'warn').mockImplementation(() => { });
    vi.spyOn(console, 'error').mockImplementation(() => { });
    vi.useFakeTimers();
    lastStatus = undefined;
    subs = [component.messages.subscribe(), component.connectionStatus.subscribe(s => lastStatus = s)];
  });

  afterEach(() => {
    subs.forEach(s => s.unsubscribe());
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('gives up after three failed attempts, backing off 2s then 4s', () => {
    expect(sockets.length).toBe(1);
    fail(0);
    vi.advanceTimersByTime(1999);
    expect(sockets.length).toBe(1);
    vi.advanceTimersByTime(1);
    expect(sockets.length).toBe(2);

    fail(1);
    vi.advanceTimersByTime(4000);
    expect(sockets.length).toBe(3);

    fail(2);
    vi.advanceTimersByTime(60000);
    expect(sockets.length).toBe(3);
    expect(lastStatus).toBe(-1);
  });

  it('starts counting again after a connection succeeds', () => {
    fail(0);
    vi.advanceTimersByTime(2000);
    fail(1);
    vi.advanceTimersByTime(4000);
    connect(2);
    fail(2);
    // The first failure after a good connection waits the first back-off
    // step again, and the stream keeps the new socket.
    vi.advanceTimersByTime(2000);
    expect(sockets.length).toBe(4);
    expect(sockets[3].closed).toBe(false);

    fail(3);
    vi.advanceTimersByTime(4000);
    expect(sockets.length).toBe(5);
    expect(sockets[4].closed).toBe(false);
  });
});

// These render the real log viewer, whose buffering polls on a 0 ms
// interval that fake timers cannot run through, so they use real timers
// and a short back-off.
describe('LogStreamTabComponent connection status', () => {
  let fixture: ComponentFixture<LogStreamTabComponent>;

  const connect = (i: number) => sockets[i].socket.next(() => new Subject<string>());
  const fail = (i: number) => sockets[i].socket.error(new Error('connection lost'));
  const status = () => {
    const region = fixture.nativeElement.querySelector('[role="status"]') as HTMLElement | null;
    expect(region).not.toBeNull();
    return region!.textContent!.trim();
  };
  const shows = (text: string) => vi.waitFor(() => expect(status()).toBe(text), { timeout: 2000 });
  const retrying = (attempt: number) => `Connection lost. Retrying (attempt ${attempt}/2)...`;
  const failed =
    'Unable to connect to log stream. Please check that the backend service is running and try refreshing the page.';

  beforeEach(async () => {
    sockets.length = 0;
    TestBed.configureTestingModule({
      imports: [LogStreamTabComponent],
      providers: [
        { provide: ApplicationService, useValue: { cfGuid: 'cf-1', appGuid: 'app-1' } },
        provideZonelessChangeDetection(),
      ]
    });
    vi.spyOn(console, 'log').mockImplementation(() => { });
    vi.spyOn(console, 'warn').mockImplementation(() => { });
    vi.spyOn(console, 'error').mockImplementation(() => { });
    fixture = TestBed.createComponent(LogStreamTabComponent);
    (fixture.componentInstance as any).retryDelayMs = 10;
    await fixture.whenStable();
  });

  afterEach(() => {
    fixture.destroy();
    vi.restoreAllMocks();
  });

  it('says it is connecting until the socket opens', async () => {
    await shows('Connecting to log stream...');
    connect(0);
    await shows('');
  });

  it('shows each retry with its attempt', async () => {
    fail(0);
    await shows(retrying(1));
    fail(1);
    await shows(retrying(2));
  });

  it('says it could not connect once the last attempt fails', async () => {
    fail(0);
    await shows(retrying(1));
    fail(1);
    await shows(retrying(2));
    fail(2);
    await shows(failed);
    expect(sockets.length).toBe(3);
  });

  it('clears the message and counts afresh after a reconnect', async () => {
    fail(0);
    await shows(retrying(1));
    connect(1);
    await shows('');
    fail(1);
    await shows(retrying(1));
  });
});
