import { APIResource } from '../../store/src/types/api.types';
import { IOrganization, IOrgQuotaDefinition, ISpace } from '../src/cf-api.types';

export const entityRelationMissingSpacesUrl = 'spaces_url';
export const entityRelationMissingQuotaGuid = 'quota_guid';
export const entityRelationMissingQuotaUrl = 'quota_url/quota_guid';

export class EntityRelationSpecHelper {

  createEmptyOrg(guid: string, name: string): APIResource<IOrganization> {
    return {
      entity: {
        name,
        spaces_url: entityRelationMissingSpacesUrl,
        quota_definition_url: entityRelationMissingQuotaUrl
      },
      metadata: {
        guid,
        url: '',
        created_at: '2017-09-08T17:23:42Z',
        updated_at: '2017-09-08T17:23:43Z'
      }
    };
  }

  createEmptySpace(guid: string, name: string, orgGuid: string): APIResource<ISpace> {
    return {
      entity: {
        name,
        organization_guid: orgGuid,
        organization_url: '',
        developers_url: '',
        auditors_url: '',
        apps_url: '',
        app_events_url: '',
        domains_url: '',
        managers_url: '',
        routes_url: '',
        security_groups_url: '',
        service_instances_url: '',
        allow_ssh: false,
        staging_security_groups_url: '',
      },
      metadata: {
        guid,
        url: '',
        created_at: '2017-09-08T17:23:42Z',
        updated_at: '2017-09-08T17:23:43Z'
      }
    };
  }

  createEmptyQuotaDefinition(guid: string, name: string): APIResource<IOrgQuotaDefinition> {
    return {
      entity: {
        memory_limit: 1,
        app_instance_limit: 2,
        instance_memory_limit: 3,
        name,
        total_routes: -1,
        total_services: -1,
        trial_db_allowed: false,
        app_task_limit: -1,
        total_service_keys: -1,
        total_reserved_route_ports: null
      },
      metadata: {
        guid,
        url: '',
        created_at: '2017-09-08T17:23:42Z',
        updated_at: '2017-09-08T17:23:43Z'
      }
    };
  }
}
