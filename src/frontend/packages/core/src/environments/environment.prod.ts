import { cfAPIVersion, proxyAPIVersion } from '../../../store/src/jetstream';

export const environment = {
  production: true,
  proxyAPIVersion,
  cfAPIVersion,
  showObsDebug: false,
  disablePolling: true,
  desktopMode: false,
  hideUserMenu: false,
  fixedSideNav: false,
};
