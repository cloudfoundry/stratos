// Golden fixture: the distribution blocks of a populated but app-empty
// foundation (603 spaces, 0 apps), recorded by the read-only reference
// collector described in GH issue #5702 (export schema_version 1). Generated
// from the collector output — do not hand-edit; the TS stats util must
// reproduce these numbers exactly from the hist samples. Null blocks are
// distributions over an empty sample (the collector records them as null).
export const FOUNDATION_B = {
  distributions: {
    spaces_per_org: {
      n: 62,
      min: 1,
      median: 10.0,
      p90: 10,
      p99: 10,
      max: 10,
      mean: 9.726,
      zeros: 0,
      sum: 603,
      hist: { '1': 1, '2': 1, '10': 60 },
    },
    apps_per_space: {
      n: 603,
      min: 0,
      median: 0,
      p90: 0,
      p99: 0,
      max: 0,
      mean: 0.0,
      zeros: 603,
      sum: 0,
      hist: { '0': 603 },
    },
    apps_per_org: {
      n: 62,
      min: 0,
      median: 0.0,
      p90: 0,
      p99: 0,
      max: 0,
      mean: 0.0,
      zeros: 62,
      sum: 0,
      hist: { '0': 62 },
    },
    routes_per_app: null,
    bindings_per_app: null,
    bindings_per_service_instance: null,
    top_share: {
      spaces_in_largest_org: { largest_holds: 10, fraction: 0.0166 },
      apps_in_largest_space: null,
      apps_in_largest_org: null,
    },
    multi_destination_routes: 0,
  },
  composition: {
    web_process_memory_mb: null,
    web_process_disk_mb: null,
    web_process_instances: null,
    domains: {
      shared: 2,
      private: 1,
      routes_per_domain: {
        n: 3,
        min: 0,
        median: 0,
        p90: 0,
        p99: 0,
        max: 0,
        mean: 0.0,
        zeros: 3,
        sum: 0,
        hist: { '0': 3 },
      },
    },
  },
};
