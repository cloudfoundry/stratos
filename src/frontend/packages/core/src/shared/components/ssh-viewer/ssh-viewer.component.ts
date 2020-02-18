import { ChangeDetectorRef, Component, ElementRef, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Observable, Subject, Subscription } from 'rxjs';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';

import { EventWatcherService } from '../../../core/event-watcher/event-watcher.service';

// Import Xterm and Xterm Fit Addon
@Component({
  selector: 'app-ssh-viewer',
  templateUrl: './ssh-viewer.component.html',
  styleUrls: ['./ssh-viewer.component.scss']
})
export class SshViewerComponent implements OnInit, OnDestroy {

  @Input()
  errorMessage: string;

  @Input()
  sshStream: Observable<any>;

  @Input()
  sshInput: Subject<string>;

  @Input()
  public connectionStatus: Observable<number>;

  public isConnected = false;
  public isConnecting = false;
  private isDestroying = false;

  @ViewChild('terminal', { static: true }) container: ElementRef;
  private xterm: Terminal;

  private xtermFitAddon = new FitAddon();

  private msgSubscription: Subscription;
  private connectSubscription: Subscription;
  private resizeSubscription: Subscription;

  constructor(private changeDetector: ChangeDetectorRef, private resizer: EventWatcherService) { }

  ngOnInit() {
    if (!this.connectionStatus) {
      return;
    }

    this.resizeSubscription = this.resizer.resizeEvent$.subscribe(r => {
      if (this.xtermFitAddon) {
        this.resize();
      }
    });

    this.connectSubscription = this.connectionStatus.subscribe((count: number) => {
      this.isConnected = (count !== 0);
      if (this.isConnected) {
        this.xterm.focus();
        this.isConnecting = false;
        this.resize();
      }
      if (!this.isDestroying) {
        this.changeDetector.detectChanges();
      }
    });

    this.xterm = new Terminal();
    this.xterm.loadAddon(this.xtermFitAddon);
    this.xterm.open(this.container.nativeElement);
    //    this.xtermFitAddon.fit();
    this.resize();

    this.xterm.onKey(e => {
      if (!this.msgSubscription.closed) {
        this.sshInput.next(JSON.stringify({ key: e.key }));
      }
    });

    this.xterm.onResize(size => {
      if (!this.msgSubscription.closed) {
        this.sshInput.next(JSON.stringify({ cols: size.cols, rows: size.rows }));
      }
    });

    this.reconnect();
  }

  public resize() {
    setTimeout(() => {
      this.xtermFitAddon.fit();
    }, 150);
  }

  ngOnDestroy() {
    this.isDestroying = true;
    this.disconnect();
    if (this.connectSubscription && !this.connectSubscription.closed) {
      this.connectSubscription.unsubscribe();
    }
    this.resizeSubscription.unsubscribe();
  }

  disconnect() {
    this.isConnecting = false;
    this.isConnected = false;
    this.errorMessage = undefined;
    if (this.msgSubscription && !this.msgSubscription.closed) {
      this.msgSubscription.unsubscribe();
    }
  }

  reconnect() {
    this.isConnecting = true;
    this.errorMessage = undefined;
    this.xterm.reset();
    this.msgSubscription = this.sshStream
      .subscribe(
        (data: string) => {
          for (const c of data.split(' ')) {
            this.xterm.write(String.fromCharCode(parseInt(c, 16)));
          }
        },
        (err) => {
          this.disconnect();
        },
        () => {
          this.disconnect();
          if (!this.isDestroying) {
            this.changeDetector.detectChanges();
          }
        }
      );
  }
}
