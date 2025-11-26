import type { ChartAttributes } from './chart';

export class ChartVersion {
  id!: string;
  type!: string;
  attributes!: ChartVersionAttributes;
  relationships!: ChartVersionRelationships;
  name?: string; // Promoted from attributes for convenience
}

export class ChartVersionAttributes {
  name?: string;
  created!: Date;
  digest!: string;
  icons!: ChartVersionIcon[];
  readme!: string;
  version!: string;
  schema?: string;
  /* tslint:disable-next-line:variable-name */
  app_version!: string;
  urls!: string[];
}

class ChartVersionIcon {
  name!: string;
  path!: string;
}

class ChartVersionRelationships {
  chart!: ChartVersionChart;
}

class ChartVersionChart {
  data!: ChartAttributes;
  links!: {
    self: string
  };
}
