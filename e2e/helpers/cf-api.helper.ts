import { RequestHelper, ConsoleUserType } from './request.helper';

/**
 * CF API Types
 * Based on Cloud Foundry V3 API
 */

export interface CFApp {
  guid: string;
  name: string;
  state: 'STOPPED' | 'STARTED';
  lifecycle: {
    type: string;
    data: {
      buildpacks?: string[];
      stack?: string;
    };
  };
  relationships: {
    space: {
      data: {
        guid: string;
      };
    };
  };
  metadata: {
    labels?: Record<string, string>;
    annotations?: Record<string, string>;
  };
}

export interface CFOrganization {
  guid: string;
  name: string;
  suspended: boolean;
  metadata: {
    labels?: Record<string, string>;
  };
}

export interface CFSpace {
  guid: string;
  name: string;
  relationships: {
    organization: {
      data: {
        guid: string;
      };
    };
  };
}

export interface CFRoute {
  guid: string;
  host: string;
  path: string;
  url: string;
  relationships: {
    domain: {
      data: {
        guid: string;
      };
    };
    space: {
      data: {
        guid: string;
      };
    };
  };
}

export interface CFDomain {
  guid: string;
  name: string;
  internal: boolean;
  router_group?: {
    type?: string;
    guid?: string;
  };
  supported_protocols?: string[];
}

export interface CFServiceInstance {
  guid: string;
  name: string;
  type: 'managed' | 'user_provided';
  relationships: {
    space: {
      data: {
        guid: string;
      };
    };
  };
}

export interface CreateAppParams {
  name: string;
  spaceGuid: string;
  buildpacks?: string[];
  stack?: string;
  instances?: number;
  memory?: number;
  disk?: number;
  environmentVariables?: Record<string, string>;
}

export interface CreateOrgParams {
  name: string;
  suspended?: boolean;
}

export interface CreateSpaceParams {
  name: string;
  orgGuid: string;
}

export interface CreateRouteParams {
  domainGuid: string;
  spaceGuid: string;
  host?: string;
  path?: string;
}

export interface CreateQuotaParams {
  name: string;
  totalServices?: number;
  totalRoutes?: number;
  memoryLimit?: number;
  instanceMemoryLimit?: number;
  totalReservedRoutePorts?: number;
  appInstanceLimit?: number;
  nonBasicServicesAllowed?: boolean;
}

export interface CreateSpaceQuotaParams extends CreateQuotaParams {
  orgGuid: string;
}

export interface CFQuota {
  guid: string;
  name: string;
  apps?: {
    total_memory_in_mb?: number;
    per_process_memory_in_mb?: number;
    total_instances?: number;
  };
  services?: {
    paid_services_allowed?: boolean;
    total_service_instances?: number;
  };
  routes?: {
    total_routes?: number;
    total_reserved_ports?: number;
  };
}

export interface CFSpaceQuota extends CFQuota {
  relationships?: {
    organization?: {
      data: {
        guid: string;
      };
    };
  };
}

/**
 * CF API Helper
 * Wraps Cloud Foundry V3 API operations
 * Handles app lifecycle, routes, services, orgs, spaces
 */
export class CFApiHelper {
  private cfApiBase: string = '';

  constructor(
    private request: RequestHelper,
    private cfGuid: string
  ) {}

  /**
   * Initialize CF API base URL from endpoint
   */
  async init(): Promise<void> {
    // Get CF endpoint details
    const endpoints = await this.request.get('/api/v1/endpoints');
    const cfEndpoint = endpoints.find((ep: any) => ep.guid === this.cfGuid);

    if (!cfEndpoint) {
      throw new Error(`CF endpoint not found: ${this.cfGuid}`);
    }

    // CF API is proxied through Stratos
    this.cfApiBase = `/pp/v1/proxy/v3/cf/${this.cfGuid}`;
  }

  // ============================================================================
  // Application Operations
  // ============================================================================

  /**
   * Create a new application
   */
  async createApp(params: CreateAppParams): Promise<CFApp> {
    if (!this.cfApiBase) await this.init();

    const appData = {
      name: params.name,
      relationships: {
        space: {
          data: {
            guid: params.spaceGuid
          }
        }
      },
      lifecycle: {
        type: 'buildpack',
        data: {
          buildpacks: params.buildpacks || [],
          stack: params.stack || 'cflinuxfs3'
        }
      },
      metadata: {
        labels: {
          'stratos-e2e-test': 'true'
        }
      }
    };

    const app = await this.request.post(`${this.cfApiBase}/apps`, appData);

    // Set environment variables if provided
    if (params.environmentVariables) {
      await this.updateAppEnvironment(app.guid, params.environmentVariables);
    }

    // Scale app if instances/memory/disk specified
    if (params.instances || params.memory || params.disk) {
      await this.scaleApp(app.guid, {
        instances: params.instances,
        memory: params.memory,
        disk: params.disk
      });
    }

    return app;
  }

  /**
   * Get application by GUID
   */
  async getApp(appGuid: string): Promise<CFApp> {
    if (!this.cfApiBase) await this.init();
    return await this.request.get(`${this.cfApiBase}/apps/${appGuid}`);
  }

  /**
   * Update application
   */
  async updateApp(appGuid: string, updates: Partial<CFApp>): Promise<CFApp> {
    if (!this.cfApiBase) await this.init();
    return await this.request.post(`${this.cfApiBase}/apps/${appGuid}`, updates);
  }

  /**
   * Delete application
   */
  async deleteApp(appGuid: string): Promise<void> {
    if (!this.cfApiBase) await this.init();
    await this.request.delete(`${this.cfApiBase}/apps/${appGuid}`);
  }

  /**
   * Start application
   */
  async startApp(appGuid: string): Promise<void> {
    if (!this.cfApiBase) await this.init();
    await this.request.post(`${this.cfApiBase}/apps/${appGuid}/actions/start`, {});
  }

  /**
   * Stop application
   */
  async stopApp(appGuid: string): Promise<void> {
    if (!this.cfApiBase) await this.init();
    await this.request.post(`${this.cfApiBase}/apps/${appGuid}/actions/stop`, {});
  }

  /**
   * Restart application
   */
  async restartApp(appGuid: string): Promise<void> {
    if (!this.cfApiBase) await this.init();
    await this.request.post(`${this.cfApiBase}/apps/${appGuid}/actions/restart`, {});
  }

  /**
   * Scale application
   */
  async scaleApp(appGuid: string, scale: {
    instances?: number;
    memory?: number;
    disk?: number;
  }): Promise<void> {
    if (!this.cfApiBase) await this.init();

    const scaleData: any = {};
    if (scale.instances !== undefined) scaleData.instances = scale.instances;
    if (scale.memory !== undefined) scaleData.memory_in_mb = scale.memory;
    if (scale.disk !== undefined) scaleData.disk_in_mb = scale.disk;

    await this.request.post(`${this.cfApiBase}/apps/${appGuid}/processes/web/actions/scale`, scaleData);
  }

  /**
   * Update app environment variables
   */
  async updateAppEnvironment(appGuid: string, vars: Record<string, string>): Promise<void> {
    if (!this.cfApiBase) await this.init();
    await this.request.post(`${this.cfApiBase}/apps/${appGuid}/environment_variables`, {
      var: vars
    });
  }

  /**
   * Wait for app to reach desired state
   */
  async waitForAppState(appGuid: string, desiredState: 'STOPPED' | 'STARTED', timeoutMs: number = 60000): Promise<void> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeoutMs) {
      const app = await this.getApp(appGuid);

      if (app.state === desiredState) {
        return;
      }

      // Wait 2 seconds before checking again
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    throw new Error(`Timeout waiting for app ${appGuid} to reach state ${desiredState}`);
  }

  // ============================================================================
  // Organization Operations
  // ============================================================================

  /**
   * Create organization
   */
  async createOrg(params: CreateOrgParams): Promise<CFOrganization> {
    if (!this.cfApiBase) await this.init();

    const orgData = {
      name: params.name,
      suspended: params.suspended || false,
      metadata: {
        labels: {
          'stratos-e2e-test': 'true'
        }
      }
    };

    return await this.request.post(`${this.cfApiBase}/organizations`, orgData);
  }

  /**
   * Get organization by GUID
   */
  async getOrg(orgGuid: string): Promise<CFOrganization> {
    if (!this.cfApiBase) await this.init();
    return await this.request.get(`${this.cfApiBase}/organizations/${orgGuid}`);
  }

  /**
   * Delete organization
   */
  async deleteOrg(orgGuid: string): Promise<void> {
    if (!this.cfApiBase) await this.init();
    await this.request.delete(`${this.cfApiBase}/organizations/${orgGuid}`);
  }

  /**
   * Find organization by name
   */
  async findOrgByName(name: string): Promise<CFOrganization | null> {
    if (!this.cfApiBase) await this.init();

    const orgs = await this.request.get(`${this.cfApiBase}/organizations?names=${encodeURIComponent(name)}`);

    return orgs.resources && orgs.resources.length > 0 ? orgs.resources[0] : null;
  }

  // ============================================================================
  // Space Operations
  // ============================================================================

  /**
   * Create space
   */
  async createSpace(params: CreateSpaceParams): Promise<CFSpace> {
    if (!this.cfApiBase) await this.init();

    const spaceData = {
      name: params.name,
      relationships: {
        organization: {
          data: {
            guid: params.orgGuid
          }
        }
      },
      metadata: {
        labels: {
          'stratos-e2e-test': 'true'
        }
      }
    };

    return await this.request.post(`${this.cfApiBase}/spaces`, spaceData);
  }

  /**
   * Get space by GUID
   */
  async getSpace(spaceGuid: string): Promise<CFSpace> {
    if (!this.cfApiBase) await this.init();
    return await this.request.get(`${this.cfApiBase}/spaces/${spaceGuid}`);
  }

  /**
   * Delete space
   */
  async deleteSpace(spaceGuid: string): Promise<void> {
    if (!this.cfApiBase) await this.init();
    await this.request.delete(`${this.cfApiBase}/spaces/${spaceGuid}`);
  }

  /**
   * Find space by name in org
   */
  async findSpaceByName(orgGuid: string, name: string): Promise<CFSpace | null> {
    if (!this.cfApiBase) await this.init();

    const spaces = await this.request.get(
      `${this.cfApiBase}/spaces?organization_guids=${orgGuid}&names=${encodeURIComponent(name)}`
    );

    return spaces.resources && spaces.resources.length > 0 ? spaces.resources[0] : null;
  }

  // ============================================================================
  // Route Operations
  // ============================================================================

  /**
   * Get domains for space
   */
  async getDomains(spaceGuid?: string): Promise<CFDomain[]> {
    if (!this.cfApiBase) await this.init();

    const url = spaceGuid
      ? `${this.cfApiBase}/domains?space_guids=${spaceGuid}`
      : `${this.cfApiBase}/domains`;

    const response = await this.request.get(url);
    return response.resources || [];
  }

  /**
   * Create route
   */
  async createRoute(params: CreateRouteParams): Promise<CFRoute> {
    if (!this.cfApiBase) await this.init();

    const routeData: any = {
      relationships: {
        domain: {
          data: {
            guid: params.domainGuid
          }
        },
        space: {
          data: {
            guid: params.spaceGuid
          }
        }
      },
      metadata: {
        labels: {
          'stratos-e2e-test': 'true'
        }
      }
    };

    if (params.host) routeData.host = params.host;
    if (params.path) routeData.path = params.path;

    return await this.request.post(`${this.cfApiBase}/routes`, routeData);
  }

  /**
   * Map route to app
   */
  async mapRoute(appGuid: string, routeGuid: string): Promise<void> {
    if (!this.cfApiBase) await this.init();

    await this.request.post(`${this.cfApiBase}/routes/${routeGuid}/destinations`, {
      destinations: [{
        app: {
          guid: appGuid
        }
      }]
    });
  }

  /**
   * Unmap route from app
   */
  async unmapRoute(routeGuid: string, appGuid: string): Promise<void> {
    if (!this.cfApiBase) await this.init();

    await this.request.delete(`${this.cfApiBase}/routes/${routeGuid}/destinations/${appGuid}`);
  }

  /**
   * Delete route
   */
  async deleteRoute(routeGuid: string): Promise<void> {
    if (!this.cfApiBase) await this.init();
    await this.request.delete(`${this.cfApiBase}/routes/${routeGuid}`);
  }

  // ============================================================================
  // Service Operations
  // ============================================================================

  /**
   * Get service instances in space
   */
  async getServiceInstances(spaceGuid: string): Promise<CFServiceInstance[]> {
    if (!this.cfApiBase) await this.init();

    const response = await this.request.get(
      `${this.cfApiBase}/service_instances?space_guids=${spaceGuid}`
    );

    return response.resources || [];
  }

  /**
   * Bind service to app
   */
  async bindService(appGuid: string, serviceInstanceGuid: string): Promise<void> {
    if (!this.cfApiBase) await this.init();

    await this.request.post(`${this.cfApiBase}/service_credential_bindings`, {
      type: 'app',
      relationships: {
        service_instance: {
          data: {
            guid: serviceInstanceGuid
          }
        },
        app: {
          data: {
            guid: appGuid
          }
        }
      }
    });
  }

  /**
   * Unbind service from app
   */
  async unbindService(bindingGuid: string): Promise<void> {
    if (!this.cfApiBase) await this.init();
    await this.request.delete(`${this.cfApiBase}/service_credential_bindings/${bindingGuid}`);
  }

  // ============================================================================
  // Quota Management
  // ============================================================================

  /**
   * Create organization quota
   */
  async createQuota(params: CreateQuotaParams): Promise<CFQuota> {
    if (!this.cfApiBase) await this.init();

    const quotaData: any = {
      name: params.name,
      apps: {},
      services: {},
      routes: {}
    };

    if (params.memoryLimit !== undefined) {
      quotaData.apps.total_memory_in_mb = params.memoryLimit;
    }
    if (params.instanceMemoryLimit !== undefined) {
      quotaData.apps.per_process_memory_in_mb = params.instanceMemoryLimit;
    }
    if (params.appInstanceLimit !== undefined) {
      quotaData.apps.total_instances = params.appInstanceLimit;
    }
    if (params.totalServices !== undefined) {
      quotaData.services.total_service_instances = params.totalServices;
    }
    if (params.nonBasicServicesAllowed !== undefined) {
      quotaData.services.paid_services_allowed = params.nonBasicServicesAllowed;
    }
    if (params.totalRoutes !== undefined) {
      quotaData.routes.total_routes = params.totalRoutes;
    }
    if (params.totalReservedRoutePorts !== undefined) {
      quotaData.routes.total_reserved_ports = params.totalReservedRoutePorts;
    }

    return await this.request.post(`${this.cfApiBase}/organization_quotas`, quotaData);
  }

  /**
   * Get organization quota by GUID
   */
  async getQuota(quotaGuid: string): Promise<CFQuota> {
    if (!this.cfApiBase) await this.init();
    return await this.request.get(`${this.cfApiBase}/organization_quotas/${quotaGuid}`);
  }

  /**
   * Get all organization quotas
   */
  async getQuotas(): Promise<CFQuota[]> {
    if (!this.cfApiBase) await this.init();
    const response = await this.request.get(`${this.cfApiBase}/organization_quotas`);
    return response.resources || [];
  }

  /**
   * Find quota by name
   */
  async findQuotaByName(name: string): Promise<CFQuota | null> {
    if (!this.cfApiBase) await this.init();
    const response = await this.request.get(`${this.cfApiBase}/organization_quotas?names=${name}`);
    return response.resources?.[0] || null;
  }

  /**
   * Update organization quota
   */
  async updateQuota(quotaGuid: string, params: Partial<CreateQuotaParams>): Promise<CFQuota> {
    if (!this.cfApiBase) await this.init();

    const quotaData: any = {};

    if (params.name !== undefined) {
      quotaData.name = params.name;
    }
    if (params.memoryLimit !== undefined || params.instanceMemoryLimit !== undefined || params.appInstanceLimit !== undefined) {
      quotaData.apps = {};
      if (params.memoryLimit !== undefined) quotaData.apps.total_memory_in_mb = params.memoryLimit;
      if (params.instanceMemoryLimit !== undefined) quotaData.apps.per_process_memory_in_mb = params.instanceMemoryLimit;
      if (params.appInstanceLimit !== undefined) quotaData.apps.total_instances = params.appInstanceLimit;
    }
    if (params.totalServices !== undefined || params.nonBasicServicesAllowed !== undefined) {
      quotaData.services = {};
      if (params.totalServices !== undefined) quotaData.services.total_service_instances = params.totalServices;
      if (params.nonBasicServicesAllowed !== undefined) quotaData.services.paid_services_allowed = params.nonBasicServicesAllowed;
    }
    if (params.totalRoutes !== undefined || params.totalReservedRoutePorts !== undefined) {
      quotaData.routes = {};
      if (params.totalRoutes !== undefined) quotaData.routes.total_routes = params.totalRoutes;
      if (params.totalReservedRoutePorts !== undefined) quotaData.routes.total_reserved_ports = params.totalReservedRoutePorts;
    }

    return await this.request.patch(`${this.cfApiBase}/organization_quotas/${quotaGuid}`, quotaData);
  }

  /**
   * Delete organization quota
   */
  async deleteQuota(quotaGuid: string): Promise<void> {
    if (!this.cfApiBase) await this.init();
    await this.request.delete(`${this.cfApiBase}/organization_quotas/${quotaGuid}`);
  }

  // ============================================================================
  // Space Quota Management
  // ============================================================================

  /**
   * Create space quota
   */
  async createSpaceQuota(params: CreateSpaceQuotaParams): Promise<CFSpaceQuota> {
    if (!this.cfApiBase) await this.init();

    const quotaData: any = {
      name: params.name,
      apps: {},
      services: {},
      routes: {},
      relationships: {
        organization: {
          data: {
            guid: params.orgGuid
          }
        }
      }
    };

    if (params.memoryLimit !== undefined) {
      quotaData.apps.total_memory_in_mb = params.memoryLimit;
    }
    if (params.instanceMemoryLimit !== undefined) {
      quotaData.apps.per_process_memory_in_mb = params.instanceMemoryLimit;
    }
    if (params.appInstanceLimit !== undefined) {
      quotaData.apps.total_instances = params.appInstanceLimit;
    }
    if (params.totalServices !== undefined) {
      quotaData.services.total_service_instances = params.totalServices;
    }
    if (params.nonBasicServicesAllowed !== undefined) {
      quotaData.services.paid_services_allowed = params.nonBasicServicesAllowed;
    }
    if (params.totalRoutes !== undefined) {
      quotaData.routes.total_routes = params.totalRoutes;
    }
    if (params.totalReservedRoutePorts !== undefined) {
      quotaData.routes.total_reserved_ports = params.totalReservedRoutePorts;
    }

    return await this.request.post(`${this.cfApiBase}/space_quotas`, quotaData);
  }

  /**
   * Get space quota by GUID
   */
  async getSpaceQuota(quotaGuid: string): Promise<CFSpaceQuota> {
    if (!this.cfApiBase) await this.init();
    return await this.request.get(`${this.cfApiBase}/space_quotas/${quotaGuid}`);
  }

  /**
   * Get all space quotas for an organization
   */
  async getSpaceQuotas(orgGuid: string): Promise<CFSpaceQuota[]> {
    if (!this.cfApiBase) await this.init();
    const response = await this.request.get(`${this.cfApiBase}/space_quotas?organization_guids=${orgGuid}`);
    return response.resources || [];
  }

  /**
   * Find space quota by name within organization
   */
  async findSpaceQuotaByName(orgGuid: string, name: string): Promise<CFSpaceQuota | null> {
    if (!this.cfApiBase) await this.init();
    const response = await this.request.get(`${this.cfApiBase}/space_quotas?organization_guids=${orgGuid}&names=${name}`);
    return response.resources?.[0] || null;
  }

  /**
   * Update space quota
   */
  async updateSpaceQuota(quotaGuid: string, params: Partial<CreateQuotaParams>): Promise<CFSpaceQuota> {
    if (!this.cfApiBase) await this.init();

    const quotaData: any = {};

    if (params.name !== undefined) {
      quotaData.name = params.name;
    }
    if (params.memoryLimit !== undefined || params.instanceMemoryLimit !== undefined || params.appInstanceLimit !== undefined) {
      quotaData.apps = {};
      if (params.memoryLimit !== undefined) quotaData.apps.total_memory_in_mb = params.memoryLimit;
      if (params.instanceMemoryLimit !== undefined) quotaData.apps.per_process_memory_in_mb = params.instanceMemoryLimit;
      if (params.appInstanceLimit !== undefined) quotaData.apps.total_instances = params.appInstanceLimit;
    }
    if (params.totalServices !== undefined || params.nonBasicServicesAllowed !== undefined) {
      quotaData.services = {};
      if (params.totalServices !== undefined) quotaData.services.total_service_instances = params.totalServices;
      if (params.nonBasicServicesAllowed !== undefined) quotaData.services.paid_services_allowed = params.nonBasicServicesAllowed;
    }
    if (params.totalRoutes !== undefined || params.totalReservedRoutePorts !== undefined) {
      quotaData.routes = {};
      if (params.totalRoutes !== undefined) quotaData.routes.total_routes = params.totalRoutes;
      if (params.totalReservedRoutePorts !== undefined) quotaData.routes.total_reserved_ports = params.totalReservedRoutePorts;
    }

    return await this.request.patch(`${this.cfApiBase}/space_quotas/${quotaGuid}`, quotaData);
  }

  /**
   * Delete space quota
   */
  async deleteSpaceQuota(quotaGuid: string): Promise<void> {
    if (!this.cfApiBase) await this.init();
    await this.request.delete(`${this.cfApiBase}/space_quotas/${quotaGuid}`);
  }

  /**
   * Apply space quota to a space
   */
  async applySpaceQuota(spaceGuid: string, quotaGuid: string): Promise<void> {
    if (!this.cfApiBase) await this.init();
    await this.request.patch(`${this.cfApiBase}/spaces/${spaceGuid}/relationships/quota`, {
      data: {
        guid: quotaGuid
      }
    });
  }

  // ============================================================================
  // Cleanup Utilities
  // ============================================================================

  /**
   * Delete all test resources (apps, routes, spaces, orgs with e2e label)
   */
  async cleanupTestResources(): Promise<void> {
    if (!this.cfApiBase) await this.init();

    // Delete apps with e2e label
    const apps = await this.request.get(`${this.cfApiBase}/apps?label_selector=stratos-e2e-test`);
    if (apps.resources) {
      for (const app of apps.resources) {
        await this.deleteApp(app.guid).catch(() => {});
      }
    }

    // Delete routes with e2e label
    const routes = await this.request.get(`${this.cfApiBase}/routes?label_selector=stratos-e2e-test`);
    if (routes.resources) {
      for (const route of routes.resources) {
        await this.deleteRoute(route.guid).catch(() => {});
      }
    }

    // Delete spaces with e2e label
    const spaces = await this.request.get(`${this.cfApiBase}/spaces?label_selector=stratos-e2e-test`);
    if (spaces.resources) {
      for (const space of spaces.resources) {
        await this.deleteSpace(space.guid).catch(() => {});
      }
    }

    // Delete orgs with e2e label
    const orgs = await this.request.get(`${this.cfApiBase}/organizations?label_selector=stratos-e2e-test`);
    if (orgs.resources) {
      for (const org of orgs.resources) {
        await this.deleteOrg(org.guid).catch(() => {});
      }
    }
  }
}
