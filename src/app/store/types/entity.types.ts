export interface CfEntitiesState {
  application: any;
  stack: any;
  space: any;
  organization: any;
  route: any;
  event: any;
}
export const CfEntityStateNames = [
  'application',
  'stack',
  'space',
  'organization',
  'route',
  'event'
];

export const defaultCfEntitiesState = {
  application: {},
  stack: {},
  space: {},
  organization: {},
  route: {},
  event: {}
};
