import { Observable } from 'rxjs/Observable';

export class ServicesServiceMock {
  servicePlans$ = Observable.of([{
    entity: {
      name: 'shared',
      free: true,
      description: 'Shared service for app-autoscaler',
      service_guid: 'f88cdd0e-82e1-429c-be8b-7ab43644c3f4',
      extra: null,
      unique_id: '826fcda4-80e1-11e7-aead-9372473ff564-plan-shared',
      'public': true,
      bindable: true,
      active: true,
      service_url: '/v2/services/f88cdd0e-82e1-429c-be8b-7ab43644c3f4',
      service_instances_url: '/v2/service_plans/333d56fa-f0ee-4327-bd0e-b79e8060f551/service_instances',
      guid: '333d56fa-f0ee-4327-bd0e-b79e8060f551',
      cfGuid: 'f5f35f55-0fa9-4da4-9986-a4025ce6bd28',
      service: 'f88cdd0e-82e1-429c-be8b-7ab43644c3f4'
    },
    metadata: {
      guid: '333d56fa-f0ee-4327-bd0e-b79e8060f551',
      url: '/v2/service_plans/333d56fa-f0ee-4327-bd0e-b79e8060f551',
      created_at: '2017-11-27T17:07:02Z',
      updated_at: '2017-11-27T17:07:03Z'
    }
  }]);
}
