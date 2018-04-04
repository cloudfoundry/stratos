import { CfOrgSpaceItem } from '../../data-services/cf-org-space-service.service';
import { APIResource } from '../../../store/types/api.types';
import { IOrganization, ISpace } from '../../../core/cf-api.types';

export function createListFilterConfig(key: string, label: string, cfOrgSpaceItem: CfOrgSpaceItem) {
  return {
    key: key,
    label: label,
    ...cfOrgSpaceItem,
    list$: cfOrgSpaceItem.list$.map((entities: any[]) => {
      return entities.map(entity => ({
        label: entity.name,
        item: entity,
        value: entity.guid
      }));
    }),
  };
}


export function sortByName(caseSensitive: boolean) {
  return (entities: APIResource<IOrganization | ISpace>[]) => {
    return entities.sort((a, b) => {
      let aName = a.entity.name;
      let bName = b.entity.name;
      if (!caseSensitive) {
        aName = a.entity.name.toUpperCase();
        bName = b.entity.name.toUpperCase();
      }
      if (aName > bName) { return 1; }
      if (aName < bName) { return -1; }
      return 0;
    });
  };
}
