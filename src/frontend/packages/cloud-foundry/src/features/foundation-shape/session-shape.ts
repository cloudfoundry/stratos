/**
 * Derives foundation shape blocks (GH #5702) from what the session's registry
 * already holds — no network calls. Field names follow the schema_version 1
 * export so assembling the anonymous dataset (#5703) is a projection, not a
 * translation.
 */
import { StApp, StOrg, StSpace } from '../../services/endpoint-data/stratos-types';
import { dist, Distribution, topShare, TopShare } from './shape-stats';

export interface SessionShape {
  distributions: {
    spaces_per_org: Distribution | null;
    apps_per_space: Distribution | null;
    apps_per_org: Distribution | null;
    routes_per_app: Distribution | null;
    top_share: {
      spaces_in_largest_org: TopShare | null;
      apps_in_largest_space: TopShare | null;
      apps_in_largest_org: TopShare | null;
    };
  };
  composition: {
    app_state: Record<string, number>;
    stacks_pinned_by_apps: Record<string, number>;
    web_process_memory_mb: Distribution | null;
    web_process_disk_mb: Distribution | null;
    web_process_instances: Distribution | null;
  };
}

/** Per-group counts for members that have a group key; keyless items are skipped. */
const countBy = <T>(items: T[], key: (item: T) => string | undefined): number[] => {
  const counts = new Map<string, number>();
  for (const item of items) {
    const k = key(item);
    if (k) {
      counts.set(k, (counts.get(k) ?? 0) + 1);
    }
  }
  return [...counts.values()];
};

const tallyBy = <T>(items: T[], key: (item: T) => string | undefined): Record<string, number> => {
  const tally: Record<string, number> = {};
  for (const item of items) {
    const k = key(item);
    if (k) {
      tally[k] = (tally[k] ?? 0) + 1;
    }
  }
  return tally;
};

const defined = (values: (number | undefined)[]): number[] =>
  values.filter((v): v is number => typeof v === 'number');

export const computeSessionShape = (orgs: StOrg[], spaces: StSpace[], apps: StApp[]): SessionShape => {
  const spacesPerOrg = countBy(spaces, s => s.orgGuid);
  const appsPerSpace = countBy(apps, a => a.spaceGuid);
  const appsPerOrg = countBy(apps, a => a.orgGuid);
  return {
    distributions: {
      spaces_per_org: dist(spacesPerOrg, orgs.length),
      apps_per_space: dist(appsPerSpace, spaces.length),
      apps_per_org: dist(appsPerOrg, orgs.length),
      routes_per_app: dist(apps.map(a => a.routes.length)),
      top_share: {
        spaces_in_largest_org: topShare(spacesPerOrg, spaces.length),
        apps_in_largest_space: topShare(appsPerSpace, apps.length),
        apps_in_largest_org: topShare(appsPerOrg, apps.length),
      },
    },
    composition: {
      app_state: tallyBy(apps, a => a.state),
      stacks_pinned_by_apps: tallyBy(apps, a => a.stackName),
      web_process_memory_mb: dist(defined(apps.map(a => a.memory))),
      web_process_disk_mb: dist(defined(apps.map(a => a.diskQuota))),
      web_process_instances: dist(apps.map(a => a.instances)),
    },
  };
};
