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
    subs = [component.messages.subscribe(), component.connectionStatus.subscribe()];
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
    expect(component.connectionStatusSignal()).toBe(-1);
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
