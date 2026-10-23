import { CommonModule } from '@angular/common';
import { Component, ElementRef, Input, OnDestroy, OnInit, ViewChild, computed, inject, signal, ChangeDetectionStrategy, input } from '@angular/core';
import { Observable, Subject, Subscription, takeUntil } from 'rxjs';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';

import { EventWatcherService } from '../../../core/event-watcher/event-watcher.service';
import { AppProgressBarComponent } from '../progress-bar/app-progress-bar.component';

// Import Xterm and Xterm Fit Addon
@Component({
  selector: 'app-ssh-viewer',
  templateUrl: './ssh-viewer.component.html',
  styleUrls: ['./ssh-viewer.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModule,
    AppProgressBarComponent
  ]
})
export class SshViewerComponent implements OnInit, OnDestroy {
  private resizer = inject(EventWatcherService);

  // The parent's error, e.g. a failed web socket. The parent clears it at the
  // start of each attempt.
  private readonly parentError = signal<string | undefined>(undefined);
  // TODO: Skipped for migration because:
  //  Accessor inputs cannot be migrated as they are too complex.
  @Input()
  set errorMessage(v: string | undefined) { this.parentError.set(v); }
  get errorMessage(): string | undefined { return this.parentError(); }

  // An error the backend sends as a '!' window title. It stays after the
  // stream closes, so the user sees why; reconnect() clears it.
  private readonly streamError = signal<string | undefined>(undefined);

  public readonly error = computed(() => this.streamError() ?? this.parentError());

  // Both hosts (app SSH, kube console) bind the stream pair; the
  // terminal cannot connect without them.
  readonly sshStream = input.required<Observable<any>>();

  readonly sshInput = input.required<Subject<string>>();

  public readonly connectionStatus = input<Observable<number>>();

  public readonly isConnected = signal(false);
  public readonly attemptingConnection = signal(false);

  // A progress window title from the backend, e.g. while a pod starts.
  public readonly message = signal('');

  @ViewChild('terminal', { static: true }) container!: ElementRef;
  private xterm!: Terminal;

  private xtermFitAddon = new FitAddon();

  private msgSubscription!: Subscription;
  private connectSubscription!: Subscription;
  private resizeSubscription!: Subscription;
  private resizeTimers: ReturnType<typeof setTimeout>[] = [];
  private destroy$ = new Subject<void>();

  ngOnInit() {
    const connectionStatus = this.connectionStatus();
    if (!connectionStatus) {
      return;
    }

    this.resizeSubscription = this.resizer.resizeEvent$
      .pipe(takeUntil(this.destroy$))
      .subscribe(_r => {
        if (this.xtermFitAddon) {
          this.resize();
        }
      });

    this.connectSubscription = connectionStatus
      .pipe(takeUntil(this.destroy$))
      .subscribe((count: number) => {
        this.isConnected.set(count !== 0);
        if (this.isConnected()) {
          this.xterm.focus();
          this.attemptingConnection.set(false);
          this.resize();
        }
      });

    this.xterm = new Terminal();
    this.xterm.loadAddon(this.xtermFitAddon);
    this.xterm.open(this.container.nativeElement);
    this.resize();

    this.xterm.onKey(e => {
      if (this.msgSubscription && !this.msgSubscription.closed) {
        this.sshInput().next(JSON.stringify({ key: e.key }));
      }
    });

    this.xterm.onResize(size => {
      if (this.msgSubscription && !this.msgSubscription.closed) {
        this.sshInput().next(JSON.stringify({ cols: size.cols, rows: size.rows }));
      }
    });

    this.reconnect();
  }

  public resize() {
    const timerId = setTimeout(() => {
      this.xtermFitAddon.fit();
    }, 150);
    this.resizeTimers.push(timerId);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();

    // Clear all pending timers
    this.resizeTimers.forEach(timerId => clearTimeout(timerId));
    this.resizeTimers = [];

    // Unsubscribe from all subscriptions
    this.disconnect();

    if (this.connectSubscription && !this.connectSubscription.closed) {
      this.connectSubscription.unsubscribe();
    }

    if (this.resizeSubscription && !this.resizeSubscription.closed) {
      this.resizeSubscription.unsubscribe();
    }

    // Dispose of xterm terminal
    if (this.xterm) {
      this.xterm.dispose();
    }
  }

  disconnect() {
    this.attemptingConnection.set(false);
    this.isConnected.set(false);
    if (this.msgSubscription && !this.msgSubscription.closed) {
      this.msgSubscription.unsubscribe();
    }
  }

  reconnect() {
    this.disconnect();
    this.attemptingConnection.set(true);
    this.streamError.set(undefined);
    this.message.set('');
    this.xterm.reset();
    this.msgSubscription = this.sshStream()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data: string) => {
          // Check for a window title message
          if (!this.isWindowTitle(data)) {
            for (const c of data.split(' ')) {
              this.xterm.write(String.fromCharCode(parseInt(c, 16)));
            }
          }
        },
        error: () => {
          this.disconnect();
        },
        complete: () => {
          this.disconnect();
        }
      });
  }
  private isWindowTitle(data: string): boolean {
    const chars = data.split(' ');
    if (chars.length > 4 &&
      parseInt(chars[0], 16) === 27 &&
      parseInt(chars[1], 16) === 93 &&
      parseInt(chars[2], 16) === 50 &&
      parseInt(chars[3], 16) === 59) {
      let title = '';
      for (let i = 4; i < chars.length - 1; i++) {
        title += String.fromCharCode(parseInt(chars[i], 16));
      }
      if (title.length > 0 && title.charAt(0) === '!') {
        this.streamError.set(title.substring(1));
        console.error(this.streamError());
        return true;
      }
      this.message.set(title);
    }
    return false;
  }
}
