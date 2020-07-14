import { LogLevel } from '../../../store/src/actions/log.actions';
import { cfAPIVersion, proxyAPIVersion } from '../../../store/src/jetstream';

export const environment = {
  production: true,
  proxyAPIVersion,
  cfAPIVersion,
  logLevel: LogLevel.WARN,
  logToConsole: true,
  logEnableConsoleActions: false,
  showObsDebug: false,
  disablePolling: true,
  desktopMode: true,
  hideUserMenu: true,
  fixedSideNav: true,
};
