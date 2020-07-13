import { LogLevel } from './../../../store/src/actions/log.actions';
import { environment as defaults } from './environment';

export const environment = {
  ...defaults,
  production: true,
  logLevel: LogLevel.WARN,
  disablePolling: true,
};
