(function () {

  'use strict';

  module.exports = {
    setupWithClusters: setupWithClusters,
    setupWithoutClusters: setupWithoutClusters
  };

  function setupWithClusters($httpBackend) {
    expectGetTemplates($httpBackend);
    expectGetSessionVerifiedWithSuccess($httpBackend);
    expectGetStackatoInfo($httpBackend);
    expectGetClustersWithSuccess($httpBackend);
    expectGetRegisterdClusters($httpBackend);
    expectGetHcfClusterInfo($httpBackend);
    expectGetHceClusterInfo($httpBackend);
    expectHcfCalls($httpBackend);
  }

  function setupWithoutClusters($httpBackend) {
    expectGetTemplates($httpBackend);
    expectGetSessionVerifiedWithSuccess($httpBackend);
    expectGetStackatoInfo($httpBackend);
    expectGetClustersWithSuccess($httpBackend);

    // Pretend that there are no clusters
    $httpBackend.whenGET('/pp/v1/cnsis/registered').respond(200, []);
    $httpBackend.whenGET('/pp/v1/proxy/v2/info').respond(200, {});
    $httpBackend.whenGET('/pp/v1/proxy/info').respond(200, {});
  }

  function expectGetTemplates($httpBackend) {
    $httpBackend.whenGET(/.+\.html$/).passThrough();
    $httpBackend.whenGET(/.+\.svg$/).passThrough();
  }

  function expectGetSessionVerifiedWithSuccess($httpBackend) {
    $httpBackend.whenGET('/pp/v1/auth/session/verify').respond(200, {
      admin: true
    });
  }

  function expectGetStackatoInfo($httpBackend) {
    $httpBackend.whenGET('/pp/v1/stackato/info').respond(200, {
      version: {
        proxy_version: 'dev',
        database_version: 20160511195737
      },
      user: {
        guid: '63ddbbe1-a185-465d-ba10-63d5c01f1a99',
        name: 'admin@cnap.local',
        admin: true
      },
      endpoints: {
        other: {
          'a0b0f8c6-d00d-47f2-8636-1f558f7ec48e': {
            guid: 'a0b0f8c6-d00d-47f2-8636-1f558f7ec48e',
            name: 'OTHER_1',
            user: {
              guid: '577f3715-8ae9-41c3-ba6e-67fff957ee48',
              name: 'hsc-admin',
              admin: false
            }
          }
        },
        hce: {
          'f0b0f8c6-d00d-47f2-8636-1f558f7ec48e': {
            guid: 'f0b0f8c6-d00d-47f2-8636-1f558f7ec48e',
            name: 'HCE_1',
            version: '',
            user: {
              guid: '577f3715-8ae9-41c3-ba6e-67fff957ee48',
              name: 'hsc-admin',
              admin: false
            },
            type: ''
          }
        },
        hcf: {
          '8221adff-529a-4567-b57a-155fb69f1bd0': {
            guid: '8221adff-529a-4567-b57a-155fb69f1bd0',
            name: 'HCF_1',
            version: '',
            user: {
              guid: 'ae257571-e323-4cd9-bd97-2b21223d9b36',
              name: 'admin',
              admin: true
            }, type: ''
          },
          '925f6b40-c0e4-4595-97e5-287c3c04b1c2': {
            guid: '925f6b40-c0e4-4595-97e5-287c3c04b1c2',
            name: 'HCF_2',
            version: '',
            user: {
              guid: '58d56fe1-cacf-484b-aa7d-61cf019e6402',
              name: 'admin',
              admin: true
            },
            type: ''
          },
          'bd4fd4f9-2001-4609-86e6-ccfa2a8ba92d': {
            guid: 'bd4fd4f9-2001-4609-86e6-ccfa2a8ba92d',
            name: 'HCF_3',
            version: '',
            user: {
              guid: 'a8b7d5ef-dee6-4e71-ae8e-348971151351',
              name: 'admin',
              admin: true
            },
            type: ''
          },
          'd13aa0f2-4500-4e0d-aa14-1b9f4e0769d8': {
            guid: 'd13aa0f2-4500-4e0d-aa14-1b9f4e0769d8',
            name: 'HCF_4',
            version: '',
            user: {
              guid: '0c97cd5a-8ef8-4f80-af46-acfa8697824e',
              name: 'test',
              admin: false
            },
            type: ''
          }
        }
      }
    });
  }

  function expectGetClustersWithSuccess($httpBackend) {
    $httpBackend.whenGET('/pp/v1/cnsis').respond(200, [
      {id: 1, name: 'HCF_1', url: ' cluster1_url', cnsi_type: 'hcf', guid: '8221adff-529a-4567-b57a-155fb69f1bd0'},
      {id: 2, name: 'HCE_1', url: ' cluster2_url', cnsi_type: 'hce', guid: 'f0b0f8c6-d00d-47f2-8636-1f558f7ec48e'}
    ]);
  }

  function expectGetRegisterdClusters($httpBackend) {
    $httpBackend.whenGET('/pp/v1/cnsis/registered').respond(200, [
      {
        valid: true,
        error: false,
        id: 1,
        name: 'HCF_1',
        url: ' cluster1_url',
        cnsi_type: 'hcf',
        guid: '8221adff-529a-4567-b57a-155fb69f1bd0'
      },
      {
        valid: true,
        error: false,
        id: 2,
        name: 'HCE_1',
        url: ' cluster2_url',
        cnsi_type: 'hce',
        guid: 'f0b0f8c6-d00d-47f2-8636-1f558f7ec48e'
      }
    ]);
  }

  function expectGetHcfClusterInfo($httpBackend) {
    $httpBackend.whenGET('/pp/v1/proxy/v2/info').respond(200, {});
  }

  function expectGetHceClusterInfo($httpBackend) {
    $httpBackend.whenGET('/pp/v1/proxy/info').respond(200, {});
  }

  function expectHcfCalls($httpBackend) {

    $httpBackend.whenGET('/pp/v1/proxy/v2/config/feature_flags').respond([]);

    $httpBackend.whenGET('/pp/v1/proxy/v2/users/ae257571-e323-4cd9-bd97-2b21223d9b36/summary').respond(
      {
        metadata: {
          guid: 'uaa-id-207',
          created_at: '2016-05-12T00:45:15Z',
          updated_at: null
        },
        entity: {
          organizations: [
            {
              metadata: {
                guid: 'a38d0083-5d1b-4505-a463-bdaa00849734',
                created_at: '2016-05-12T00:45:15Z',
                updated_at: null
              },
              entity: {
                name: 'name-1476',
                billing_enabled: false,
                status: 'active',
                spaces: [
                  {
                    metadata: {
                      guid: 'fa588a74-c087-479c-b39d-4cbb5f293e5f',
                      created_at: '2016-05-12T00:45:15Z',
                      updated_at: null
                    },
                    entity: {
                      name: 'name-1478'
                    }
                  }
                ],
                quota_definition: {
                  metadata: {
                    guid: '23b0a8e9-1108-4af7-8383-e1b1a17414eb',
                    created_at: '2016-05-12T00:45:15Z',
                    updated_at: null
                  },
                  entity: {
                    name: 'name-1477',
                    non_basic_services_allowed: true,
                    total_services: 60,
                    memory_limit: 20480,
                    trial_db_allowed: false,
                    total_routes: 1000,
                    instance_memory_limit: -1,
                    total_private_domains: -1,
                    app_instance_limit: -1,
                    app_task_limit: -1
                  }
                },
                managers: [
                  {
                    metadata: {
                      guid: 'uaa-id-207',
                      created_at: '2016-05-12T00:45:15Z',
                      updated_at: null
                    },
                    entity: {
                      admin: false,
                      active: false,
                      default_space_guid: null
                    }
                  }
                ]
              }
            }
          ],
          managed_organizations: [
            {
              metadata: {
                guid: 'a38d0083-5d1b-4505-a463-bdaa00849734',
                created_at: '2016-05-12T00:45:15Z',
                updated_at: null
              },
              entity: {
                name: 'name-1476',
                billing_enabled: false,
                status: 'active',
                spaces: [
                  {
                    metadata: {
                      guid: 'fa588a74-c087-479c-b39d-4cbb5f293e5f',
                      created_at: '2016-05-12T00:45:15Z',
                      updated_at: null
                    },
                    entity: {
                      name: 'name-1478'
                    }
                  }
                ],
                quota_definition: {
                  metadata: {
                    guid: '23b0a8e9-1108-4af7-8383-e1b1a17414eb',
                    created_at: '2016-05-12T00:45:15Z',
                    updated_at: null
                  },
                  entity: {
                    name: 'name-1477',
                    non_basic_services_allowed: true,
                    total_services: 60,
                    memory_limit: 20480,
                    trial_db_allowed: false,
                    total_routes: 1000,
                    instance_memory_limit: -1,
                    total_private_domains: -1,
                    app_instance_limit: -1,
                    app_task_limit: -1
                  }
                },
                managers: [
                  {
                    metadata: {
                      guid: 'uaa-id-207',
                      created_at: '2016-05-12T00:45:15Z',
                      updated_at: null
                    },
                    entity: {
                      admin: false,
                      active: false,
                      default_space_guid: null
                    }
                  }
                ]
              }
            }
          ],
          billing_managed_organizations: [
            {
              metadata: {
                guid: 'a38d0083-5d1b-4505-a463-bdaa00849734',
                created_at: '2016-05-12T00:45:15Z',
                updated_at: null
              },
              entity: {
                name: 'name-1476',
                billing_enabled: false,
                status: 'active',
                spaces: [
                  {
                    metadata: {
                      guid: 'fa588a74-c087-479c-b39d-4cbb5f293e5f',
                      created_at: '2016-05-12T00:45:15Z',
                      updated_at: null
                    },
                    entity: {
                      name: 'name-1478'
                    }
                  }
                ],
                quota_definition: {
                  metadata: {
                    guid: '23b0a8e9-1108-4af7-8383-e1b1a17414eb',
                    created_at: '2016-05-12T00:45:15Z',
                    updated_at: null
                  },
                  entity: {
                    name: 'name-1477',
                    non_basic_services_allowed: true,
                    total_services: 60,
                    memory_limit: 20480,
                    trial_db_allowed: false,
                    total_routes: 1000,
                    instance_memory_limit: -1,
                    total_private_domains: -1,
                    app_instance_limit: -1,
                    app_task_limit: -1
                  }
                },
                managers: [
                  {
                    metadata: {
                      guid: 'uaa-id-207',
                      created_at: '2016-05-12T00:45:15Z',
                      updated_at: null
                    },
                    entity: {
                      admin: false,
                      active: false,
                      default_space_guid: null
                    }
                  }
                ]
              }
            }
          ],
          audited_organizations: [
            {
              metadata: {
                guid: 'a38d0083-5d1b-4505-a463-bdaa00849734',
                created_at: '2016-05-12T00:45:15Z',
                updated_at: null
              },
              entity: {
                name: 'name-1476',
                billing_enabled: false,
                status: 'active',
                spaces: [
                  {
                    metadata: {
                      guid: 'fa588a74-c087-479c-b39d-4cbb5f293e5f',
                      created_at: '2016-05-12T00:45:15Z',
                      updated_at: null
                    },
                    entity: {
                      name: 'name-1478'
                    }
                  }
                ],
                quota_definition: {
                  metadata: {
                    guid: '23b0a8e9-1108-4af7-8383-e1b1a17414eb',
                    created_at: '2016-05-12T00:45:15Z',
                    updated_at: null
                  },
                  entity: {
                    name: 'name-1477',
                    non_basic_services_allowed: true,
                    total_services: 60,
                    memory_limit: 20480,
                    trial_db_allowed: false,
                    total_routes: 1000,
                    instance_memory_limit: -1,
                    total_private_domains: -1,
                    app_instance_limit: -1,
                    app_task_limit: -1
                  }
                },
                managers: [
                  {
                    metadata: {
                      guid: 'uaa-id-207',
                      created_at: '2016-05-12T00:45:15Z',
                      updated_at: null
                    },
                    entity: {
                      admin: false,
                      active: false,
                      default_space_guid: null
                    }
                  }
                ]
              }
            }
          ],
          spaces: [
            {
              metadata: {
                guid: 'fa588a74-c087-479c-b39d-4cbb5f293e5f',
                created_at: '2016-05-12T00:45:15Z',
                updated_at: null
              },
              entity: {
                name: 'name-1478'
              }
            }
          ],
          managed_spaces: [
            {
              metadata: {
                guid: 'fa588a74-c087-479c-b39d-4cbb5f293e5f',
                created_at: '2016-05-12T00:45:15Z',
                updated_at: null
              },
              entity: {
                name: 'name-1478'
              }
            }
          ],
          audited_spaces: [
            {
              metadata: {
                guid: 'fa588a74-c087-479c-b39d-4cbb5f293e5f',
                created_at: '2016-05-12T00:45:15Z',
                updated_at: null
              },
              entity: {
                name: 'name-1478'
              }
            }
          ]
        }
      }
    );

    $httpBackend.whenGET('/pp/v1/proxy/v2/organizations?results-per-page=100').respond({
      total_results: 1,
      total_pages: 1,
      prev_url: null,
      next_url: null,
      resources: [
        {
          metadata: {
            guid: '668f2a77-6db4-4ec1-8ce8-a735e0e3d544',
            url: '/v2/organizations/668f2a77-6db4-4ec1-8ce8-a735e0e3d544',
            created_at: '2017-01-05T15:47:07Z',
            updated_at: '2017-01-05T15:52:28Z'
          },
          entity: {
            name: 'e2e',
            billing_enabled: false,
            quota_definition_guid: '2e5222e1-4a1d-4875-a980-36c80527cfb7',
            status: 'active',
            default_isolation_segment_guid: null,
            quota_definition_url: '/v2/quota_definitions/2e5222e1-4a1d-4875-a980-36c80527cfb7',
            spaces_url: '/v2/organizations/668f2a77-6db4-4ec1-8ce8-a735e0e3d544/spaces',
            domains_url: '/v2/organizations/668f2a77-6db4-4ec1-8ce8-a735e0e3d544/domains',
            private_domains_url: '/v2/organizations/668f2a77-6db4-4ec1-8ce8-a735e0e3d544/private_domains',
            users_url: '/v2/organizations/668f2a77-6db4-4ec1-8ce8-a735e0e3d544/users',
            managers_url: '/v2/organizations/668f2a77-6db4-4ec1-8ce8-a735e0e3d544/managers',
            billing_managers_url: '/v2/organizations/668f2a77-6db4-4ec1-8ce8-a735e0e3d544/billing_managers',
            auditors_url: '/v2/organizations/668f2a77-6db4-4ec1-8ce8-a735e0e3d544/auditors',
            app_events_url: '/v2/organizations/668f2a77-6db4-4ec1-8ce8-a735e0e3d544/app_events',
            space_quota_definitions_url: '/v2/organizations/668f2a77-6db4-4ec1-8ce8-a735e0e3d544/space_quota_definitions'
          }
        }
      ]
    });

    $httpBackend.whenGET('/pp/v1/proxy/v2/organizations/668f2a77-6db4-4ec1-8ce8-a735e0e3d544/spaces?results-per-page=100').respond({
      total_results: 1,
      total_pages: 1,
      prev_url: null,
      next_url: null,
      resources: [
        {
          metadata: {
            guid: '8eccd354-2bd3-4be4-b922-21905827bcb1',
            url: '/v2/spaces/8eccd354-2bd3-4be4-b922-21905827bcb1',
            created_at: '2017-01-05T15:48:12Z',
            updated_at: '2017-01-05T15:48:12Z'
          },
          entity: {
            name: 'e2e',
            organization_guid: '797094c9-2843-4335-895e-d7a9ef1fb320',
            space_quota_definition_guid: null,
            isolation_segment_guid: null,
            allow_ssh: true,
            organization_url: '/v2/organizations/797094c9-2843-4335-895e-d7a9ef1fb320',
            developers_url: '/v2/spaces/8eccd354-2bd3-4be4-b922-21905827bcb1/developers',
            managers_url: '/v2/spaces/8eccd354-2bd3-4be4-b922-21905827bcb1/managers',
            auditors_url: '/v2/spaces/8eccd354-2bd3-4be4-b922-21905827bcb1/auditors',
            apps_url: '/v2/spaces/8eccd354-2bd3-4be4-b922-21905827bcb1/apps',
            routes_url: '/v2/spaces/8eccd354-2bd3-4be4-b922-21905827bcb1/routes',
            domains_url: '/v2/spaces/8eccd354-2bd3-4be4-b922-21905827bcb1/domains',
            service_instances_url: '/v2/spaces/8eccd354-2bd3-4be4-b922-21905827bcb1/service_instances',
            app_events_url: '/v2/spaces/8eccd354-2bd3-4be4-b922-21905827bcb1/app_events',
            events_url: '/v2/spaces/8eccd354-2bd3-4be4-b922-21905827bcb1/events',
            security_groups_url: '/v2/spaces/8eccd354-2bd3-4be4-b922-21905827bcb1/security_groups'
          }
        }
      ]
    });
  }
})();
