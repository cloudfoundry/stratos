import { APIResource } from '../../store/src/types/api.types';
import { IApp } from './cf-api.types';
import { CfApplicationState } from './store/types/application.types';

export function getStartedAppInstanceCount(apps: APIResource<IApp>[]): number {
  if (!apps || !apps.length) {
    return 0;
  }
  return apps
    .filter(app => app.entity.state === CfApplicationState.STARTED)
    .map(app => app.entity.instances)
    .reduce((x, sum) => x + sum, 0);
}

export function getEntityFlattenedList<T>(property: string, entities: APIResource<any>[]): T[] {
  const all = entities
    .map(s => s.entity[property])
    .filter(s => !!s);
  return [].concat.apply([], all);
}
