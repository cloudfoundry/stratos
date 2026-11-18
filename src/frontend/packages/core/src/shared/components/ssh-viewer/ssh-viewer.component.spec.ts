import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Subject } from 'rxjs';

import { CoreModule } from '../../../core/core.module';
import { SshViewerComponent } from './ssh-viewer.component';

// happy-dom has no canvas, so xterm cannot open a real terminal.
vi.mock('xterm', () => ({
  Terminal: class {
    loadAddon() { }
    open() { }
    attachCustomKeyEventHandler() { }
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

// The backend sends a window title as an OSC 2 sequence: ESC ] 2 ; <title> BEL,
// with each character as a hex code separated by spaces and a trailing newline.
function windowTitle(title: string): string {
  const codes = [27, 93, 50, 59, ...Array.from(title).map(c => c.charCodeAt(0)), 7];
  return codes.map(c => c.toString(16)).join(' ') + '\n';
}

describe('SshViewerComponent', () => {
  let component: SshViewerComponent;
  let fixture: ComponentFixture<SshViewerComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
      imports: [
        SshViewerComponent,
        CoreModule,
      ]
    });
    TestBed.compileComponents();
  });

  afterEach(() => {
    // Properly clean up the component
    if (fixture) {
      fixture.destroy();
    }
  });

  describe('without a connection', () => {
    beforeEach(() => {
      fixture = TestBed.createComponent(SshViewerComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should create', () => {
      expect(component).toBeTruthy();
    });
  });

  describe('with a connection', () => {
    let stream: Subject<string>;
    let status: Subject<number>;

    const text = (): string => fixture.nativeElement.textContent.replace(/\s+/g, ' ').trim();
    const progressBar = (): Element | null => fixture.nativeElement.querySelector('app-progress-bar');

    beforeEach(async () => {
      stream = new Subject<string>();
      status = new Subject<number>();
      fixture = TestBed.createComponent(SshViewerComponent);
      component = fixture.componentInstance;
      fixture.componentRef.setInput('sshStream', stream);
      fixture.componentRef.setInput('sshInput', new Subject<string>());
      fixture.componentRef.setInput('connectionStatus', status);
      fixture.detectChanges();
      await fixture.whenStable();
    });

    it('shows the progress bar while connecting', () => {
      expect(progressBar()).not.toBeNull();
    });

    it('shows a window title message that arrives on the stream', async () => {
      stream.next(windowTitle('Launching Kubernetes Terminal'));
      await fixture.whenStable();
      expect(text()).toContain('Launching Kubernetes Terminal');
    });

    it('shows an error window title that arrives on the stream', async () => {
      stream.next(windowTitle('!Pod failed to start'));
      await fixture.whenStable();
      expect(text()).toContain('Pod failed to start');
    });

    it('keeps the error after the stream closes', async () => {
      stream.next(windowTitle('!Pod failed to start'));
      stream.complete();
      await fixture.whenStable();
      expect(text()).toContain('Pod failed to start');
      expect(text()).not.toContain('Disconnected');
      expect(progressBar()).toBeNull();
    });

    it('shows Disconnected when the stream closes without an error', async () => {
      status.next(1);
      await fixture.whenStable();
      status.next(0);
      stream.complete();
      await fixture.whenStable();
      expect(text()).toContain('Disconnected');
    });

    it('clears the error when it reconnects', async () => {
      stream.next(windowTitle('!Pod failed to start'));
      stream.complete();
      await fixture.whenStable();

      stream = new Subject<string>();
      fixture.componentRef.setInput('sshStream', stream);
      component.reconnect();
      await fixture.whenStable();
      expect(text()).not.toContain('Pod failed to start');
      expect(progressBar()).not.toBeNull();
    });

    it('shows an error passed in by the parent', async () => {
      fixture.componentRef.setInput('errorMessage', 'Error connecting to web socket');
      await fixture.whenStable();
      expect(text()).toContain('Error connecting to web socket');
    });

    // true: xterm takes the key for the shell; false: the browser moves focus.
    it('gives Tab to the shell until Ctrl+Shift+M, and always lets it leave after the session', async () => {
      const key = (type: string, init: KeyboardEventInit) => new KeyboardEvent(type, init);
      const hint = (): string => fixture.nativeElement.querySelector('#ssh-tab-hint').textContent;
      status.next(1);
      await fixture.whenStable();
      expect(component.handleKey(key('keydown', { key: 'Tab' }))).toBe(true);
      expect(hint()).toContain('Tab goes to the shell. Press Ctrl+Shift+M so Tab moves focus.');

      const toggle = key('keydown', { key: 'M', code: 'KeyM', ctrlKey: true, shiftKey: true, cancelable: true });
      expect(component.handleKey(toggle)).toBe(false);
      expect(toggle.defaultPrevented).toBe(true);
      await fixture.whenStable();
      expect(component.handleKey(key('keydown', { key: 'Tab', shiftKey: true }))).toBe(false);
      expect(hint()).toContain('Tab moves focus. Press Ctrl+Shift+M so Tab goes to the shell.');

      component.handleKey(key('keydown', { key: 'M', code: 'KeyM', ctrlKey: true, shiftKey: true }));
      expect(component.handleKey(key('keydown', { key: 'Tab' }))).toBe(true);

      status.next(0);
      stream.complete();
      await fixture.whenStable();
      expect(component.handleKey(key('keydown', { key: 'Tab' }))).toBe(false);
      expect(fixture.nativeElement.querySelector('[role="status"]').textContent).toContain('Disconnected');
    });

    it('clears the progress bar once connected', async () => {
      status.next(1);
      await fixture.whenStable();
      expect(component.isConnected()).toBe(true);
      expect(progressBar()).toBeNull();
    });
  });
});
