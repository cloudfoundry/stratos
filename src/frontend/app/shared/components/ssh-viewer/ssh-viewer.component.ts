import {
  Component, OnInit, OnDestroy, AfterViewChecked, Input, Output, ViewChild, ElementRef, ViewEncapsulation,
  EventEmitter, HostListener
} from '@angular/core';

import { Observable } from 'rxjs/Rx';
import { Subscription } from 'rxjs/Subscription';
import { QueueingSubject } from 'queueing-subject';
import { Subject } from 'rxjs/Subject';

// Import Xterm
import * as Terminal from 'xterm/dist/xterm.js';
import 'xterm/dist/addons/fit/fit.js';
import { map } from 'rxjs/operators';
import { ChangeDetectorRef } from '@angular/core';
@Component({
  selector: 'app-ssh-viewer',
  templateUrl: './ssh-viewer.component.html',
  styleUrls: ['./ssh-viewer.component.scss']
})
export class SshViewerComponent implements OnInit, OnDestroy, AfterViewChecked {

  @Input('errorMessage')
  errorMessage: string;

  @Input('sshStream')
  sshStream: Observable<any>;

  @Input('sshInput')
  sshInput: QueueingSubject<string>;

  @Input('connectionStatus')
  public connectionStatus: Observable<number>;

  public isConnected = false;
  public isConnecting = false;
  private isDestroying = false;

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

    this.xterm.open(this.container.nativeElement, false);
    this.xterm.on('data', this.onTermSendData);
    this.xterm.on('resize', this.onTermResize);

    this.reconnect();
  }

  ngAfterViewChecked() {
    if (this.xterm) {
      this.xterm.fit();
    }
  }

  ngOnDestroy() {
    this.isDestroying = true;
    this.xterm.off('data', this.onTermSendData);
    this.xterm.off('resize', this.onTermResize);
    this.disconnect();
    this.connectSubscription.unsubscribe();
  }

  disconnect() {
    this.isConnecting = false;
    this.isConnected = false;
    this.errorMessage = undefined;
    if (!this.msgSubscription.closed) {
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
}
