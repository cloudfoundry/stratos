import { APIResource } from '../store/types/api.types';
import { IApp } from './cf-api.types';

export function startedAppInstances(apps: APIResource<IApp>[]): number {
  return apps ? apps
    .filter(app => app.entity.state === 'STARTED')
    .map(app => app.entity.instances).reduce((x, sum) => x + sum, 0) : 0;
}
