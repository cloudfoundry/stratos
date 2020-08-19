import { cfAPIVersion, proxyAPIVersion } from '@stratosui/store';
import { LogLevel } from '@stratosui/store';

export const environment = {
  production: true,
  logLevel: LogLevel.WARN,
  proxyAPIVersion,
  cfAPIVersion,
  logToConsole: true,
  logEnableConsoleActions: false,
  showObsDebug: false,
  disablePolling: false
};
