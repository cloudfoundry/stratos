import { LogLevel } from './../../../store/src/actions/log.actions';

export const environment = {
  production: true,
  logLevel: LogLevel.WARN,
  proxyAPIVersion: 'v1',
  cfAPIVersion: 'v2',
  logToConsole: true,
  logEnableConsoleActions: false,
  showObsDebug: false,
  disablePolling: false
};
