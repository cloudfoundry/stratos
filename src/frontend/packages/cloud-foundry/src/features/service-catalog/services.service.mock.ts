import { of as observableOf } from 'rxjs';


export class ServicesServiceMock {
  servicePlanVisibilities$ = observableOf([]);
  service$ = observableOf(
    {
      entity: {
        label: 'app-autoscaler',
        provider: null,
        url: null,
        description: 'Shared service for app-autoscaler',
        long_description: null,
        version: null,
        info_url: null,
        active: true,
        bindable: true,
        unique_id: '826fcda4-80e1-11e7-aead-9372473ff564-service-app-autoscaler',
        // tslint:disable-next-line:max-line-length
        extra: '{"displayName":"app-autoscaler","imageUrl":"test","longDescription":"","providerDisplayName":"","documentationUrl":"","supportUrl":""}',
        tags: [
          'simple',
          'shared'
        ],
        requires: [],
        documentation_url: null,
        service_broker_guid: 'a55f1a04-e3a3-4a89-92ee-94e3f96103f3',
        plan_updateable: false,
        service_plans_url: '/v2/services/f88cdd0e-82e1-429c-be8b-7ab43644c3f4/service_plans',
        service_plans: [
          '333d56fa-f0ee-4327-bd0e-b79e8060f551'
        ],
        guid: 'f88cdd0e-82e1-429c-be8b-7ab43644c3f4',
        cfGuid: '7d5e510b-8396-4db0-a91c-6abdc390c9d1'
      },
      metadata: {
        guid: 'f88cdd0e-82e1-429c-be8b-7ab43644c3f4',
        url: '/v2/services/f88cdd0e-82e1-429c-be8b-7ab43644c3f4',
        created_at: '2017-11-27T17:07:02Z',
        updated_at: '2017-11-27T17:07:02Z'
      }
    });
  servicePlan = {
    entity: {
      name: 'shared',
      free: true,
      description: 'Shared service for app-autoscaler',
      service_guid: 'f88cdd0e-82e1-429c-be8b-7ab43644c3f4',
      extra: null,
      unique_id: '826fcda4-80e1-11e7-aead-9372473ff564-plan-shared',
      public: true,
      bindable: true,
      active: true,
      service_url: '/v2/services/f88cdd0e-82e1-429c-be8b-7ab43644c3f4',
      service_instances_url: '/v2/service_plans/333d56fa-f0ee-4327-bd0e-b79e8060f551/service_instances',
      guid: '333d56fa-f0ee-4327-bd0e-b79e8060f551',
      cfGuid: 'f5f35f55-0fa9-4da4-9986-a4025ce6bd28',
    },
    metadata: {
      guid: '333d56fa-f0ee-4327-bd0e-b79e8060f551',
      url: '/v2/service_plans/333d56fa-f0ee-4327-bd0e-b79e8060f551',
      created_at: '2017-11-27T17:07:02Z',
      updated_at: '2017-11-27T17:07:03Z'
    }
  };

  servicePlans$ = observableOf([{
    entity: {
      name: 'shared',
      free: true,
      description: 'Shared service for app-autoscaler',
      service_guid: 'f88cdd0e-82e1-429c-be8b-7ab43644c3f4',
      extra: null,
      unique_id: '826fcda4-80e1-11e7-aead-9372473ff564-plan-shared',
      public: true,
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

  serviceInstances$ = observableOf([]);
  isSpaceScoped$ = observableOf({
    isSpaceScoped: false
  });
  serviceBroker$ = observableOf({
    entity: {
      name: 'app-autoscaler',
      broker_url: 'https://app-autoscaler-broker.cf-dev.io',
      auth_username: 'admin',
      space_guid: null,
      guid: 'a55f1a04-e3a3-4a89-92ee-94e3f96103f3',
      cfGuid: '7d5e510b-8396-4db0-a91c-6abdc390c9d1'
    },
    metadata: {
      guid: 'a55f1a04-e3a3-4a89-92ee-94e3f96103f3',
      url: '/v2/service_brokers/a55f1a04-e3a3-4a89-92ee-94e3f96103f3',
      created_at: '2017-11-27T17:07:02Z',
      updated_at: '2017-11-27T17:07:02Z'
    }
  });
  getServicePlanVisibilities = () => observableOf([]);
  getVisibleServicePlans = () => this.servicePlans$;
  getServicePlanAccessibility = () => observableOf({
    isPublic: true
  })


  getDocumentationUrl = () => '';
  getSupportUrl = () => '';
  getServiceName = () => '';
  getServiceDescription = () => '';
  getServiceProviderName = () => '';
}
