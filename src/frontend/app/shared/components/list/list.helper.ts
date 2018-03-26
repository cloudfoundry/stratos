import { CfOrgSpaceItem } from '../../data-services/cf-org-space-service.service';

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
