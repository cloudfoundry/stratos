import { Injectable } from '@angular/core';

import { ElectronWindow, IpcRenderer, RendererInterface } from './electron';

declare let window: ElectronWindow;

@Injectable({
  providedIn: 'root',
})
export class ElectronService {
  private pElectron: RendererInterface;

  private get electron(): RendererInterface {
    if (!this.pElectron) {
      if (window && window.require) {
        this.pElectron = window.require('electron');
        return this.pElectron;
      }
      return null;
    }
    return this.pElectron;
  }

  /**
   * Determines if Application is running in Electron
   *
   * Imported from unmaintained ngx-electron
   * Only includes bare miniumum of what we need
   */
  public get isElectronApp(): boolean {
    return !!window.navigator.userAgent.match(/Electron/);
  }

  public get ipcRenderer(): IpcRenderer {
    return this.electron ? this.electron.ipcRenderer : null;
  }

}
