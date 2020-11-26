import { cfAPIVersion, proxyAPIVersion } from '../../../store/src/jetstream';

export const environment = {
  production: true,
  proxyAPIVersion,
  cfAPIVersion,
  logToConsole: true,
  showObsDebug: false,
  disablePolling: true,
  desktopMode: true,
  hideUserMenu: true,
  fixedSideNav: true,
};
