import {
  AfterViewChecked,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Input,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';

import { Terminal } from 'xterm';
import { fit } from 'xterm/lib/addons/fit/fit';

import { Observable, Subject, Subscription } from 'rxjs';

// Import Xterm
@Component({
  selector: 'app-ssh-viewer',
  templateUrl: './ssh-viewer.component.html',
  styleUrls: ['./ssh-viewer.component.scss']
})
export class SshViewerComponent implements OnInit, OnDestroy, AfterViewChecked {

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

  public message = '';

  @ViewChild('terminal') container: ElementRef;
  private xterm: Terminal;

  private msgSubscription: Subscription;
  private connectSubscription: Subscription;

  private onTermSendData = this.termSendData.bind(this);
  private onTermResize = this.termResize.bind(this);

  constructor(private changeDetector: ChangeDetectorRef) { }

  ngOnInit() {
    if (!this.connectionStatus) {
      return;
    }

    this.connectSubscription = this.connectionStatus.subscribe((count: number) => {
      this.isConnected = (count !== 0);
      if (this.isConnected) {
        this.xterm.focus();
        this.isConnecting = false;
      }
      if (!this.isDestroying) {
        this.changeDetector.detectChanges();
      }
    });

    this.xterm = new Terminal({
      cols: 80,
      rows: 40
    });

    this.xterm.open(this.container.nativeElement);
    this.xterm.on('data', this.onTermSendData);
    this.xterm.on('resize', this.onTermResize);

    this.reconnect();
  }

  ngAfterViewChecked() {
    if (this.xterm) {
      fit(this.xterm);
    }
  }

  ngOnDestroy() {
    this.isDestroying = true;
    if (this.xterm) {
      this.xterm.off('data', this.onTermSendData);
      this.xterm.off('resize', this.onTermResize);
    }
    this.disconnect();
    if (this.connectSubscription && !this.connectSubscription.closed) {
      this.connectSubscription.unsubscribe();
    }
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
          // Check for a window title message
          if (!this.isWindowTitle(data)) {
            for (const c of data.split(' ')) {
              this.xterm.write(String.fromCharCode(parseInt(c, 16)));
            }
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

  termSendData(d) {
    if (!this.msgSubscription.closed) {
      this.sshInput.next(JSON.stringify({ key: d }));
    }
  }

  termResize(size) {
    if (!this.msgSubscription.closed && this.sshInput) {
      this.sshInput.next(JSON.stringify({ cols: size.cols, rows: size.rows }));
    }
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
        this.message = title;
      }
    return false;
  }
}
