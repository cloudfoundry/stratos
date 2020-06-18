import { cfAPIVersion, proxyAPIVersion } from '../../../store/src/jetstream';
import { LogLevel } from './../../../store/src/actions/log.actions';

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
