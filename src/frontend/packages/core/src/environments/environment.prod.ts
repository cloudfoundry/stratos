import { LogLevel } from '../../../store/src/actions/log.actions';
import { cfAPIVersion, proxyAPIVersion } from '../../../store/src/jetstream';

export const environment = {
  production: true,
  proxyAPIVersion,
  cfAPIVersion,
  logLevel: LogLevel.WARN,
  showObsDebug: false,
  disablePolling: true,
  desktopMode: false,
  hideUserMenu: false,
  fixedSideNav: false,
};
