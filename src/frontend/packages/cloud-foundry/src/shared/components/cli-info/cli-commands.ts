import { CFAppCLIInfoContext } from './cli-info.component';

// The names a command fills in. The CLI Info context carries them, and a
// tabbed page can give just these.
export type CliCommandNames = Pick<CFAppCLIInfoContext, 'appName' | 'orgName' | 'spaceName'>;

// One cf CLI command, with the names filled in from the page's context.
export interface CliCommand {
  name: string;
  // What the command does, as a sentence ending in a colon.
  msg: string;
  syntax: (names: CliCommandNames) => string;
}

// The commands that match one tab of a tabbed page. `tab` is the tab's route
// link (`variables`, `space-quota`), not its label.
export interface CliTabCommands {
  tab: string;
  label: string;
  commands: CliCommand[];
}

// The commands of one tab; none for a tab that has no CLI equivalent.
export function commandsForTab(list: CliTabCommands[], tab: string | null): CliCommand[] {
  return list.find(section => section.tab === tab)?.commands ?? [];
}

// Names are quoted so a name with a space in it stays one argument. The
// placeholders stand in until the page knows the name.
const app = (c: CliCommandNames) => `"${c.appName || '[app name]'}"`;
const org = (c: CliCommandNames) => `"${c.orgName || '[organization name]'}"`;
const space = (c: CliCommandNames) => `"${c.spaceName || '[space name]'}"`;

export const APPLICATION_CLI_COMMANDS: CliTabCommands[] = [
  {
    tab: 'summary', label: 'Summary', commands: [
      { name: 'Summary', msg: 'To get the application summary:', syntax: c => `cf app ${app(c)}` },
      { name: 'Start', msg: 'To start the application:', syntax: c => `cf start ${app(c)}` },
      { name: 'Stop', msg: 'To stop the application:', syntax: c => `cf stop ${app(c)}` },
      { name: 'Restart', msg: 'To restart the application:', syntax: c => `cf restart ${app(c)}` },
      { name: 'Restage', msg: 'To restage the application:', syntax: c => `cf restage ${app(c)}` },
      { name: 'Instances', msg: 'To change the number of application instances:', syntax: c => `cf scale ${app(c)} -i [N]` },
      { name: 'Memory', msg: 'To change the memory allocated to application instances:', syntax: c => `cf scale ${app(c)} -m [N]M` },
      { name: 'SSH', msg: 'To open a shell on an application instance:', syntax: c => `cf ssh ${app(c)}` },
    ],
  },
  {
    tab: 'log-stream', label: 'Log Stream', commands: [
      { name: 'Stream', msg: 'To stream the application logs:', syntax: c => `cf logs ${app(c)}` },
      { name: 'Recent', msg: 'To show the recent application logs:', syntax: c => `cf logs ${app(c)} --recent` },
    ],
  },
  {
    tab: 'revisions', label: 'Revisions', commands: [
      { name: 'List', msg: 'To list the application revisions:', syntax: c => `cf revisions ${app(c)}` },
      { name: 'Rollback', msg: 'To roll the application back to a revision:', syntax: c => `cf rollback ${app(c)} --version [N]` },
    ],
  },
  {
    tab: 'routes', label: 'Routes', commands: [
      { name: 'Map', msg: 'To map a route to the application:', syntax: c => `cf map-route ${app(c)} [domain] --hostname [host]` },
      { name: 'Unmap', msg: 'To unmap a route from the application:', syntax: c => `cf unmap-route ${app(c)} [domain] --hostname [host]` },
    ],
  },
  {
    tab: 'variables', label: 'Variables', commands: [
      { name: 'List', msg: 'To show the application environment variables:', syntax: c => `cf env ${app(c)}` },
      { name: 'Set', msg: 'To set an environment variable:', syntax: c => `cf set-env ${app(c)} [name] [value]` },
      { name: 'Unset', msg: 'To remove an environment variable:', syntax: c => `cf unset-env ${app(c)} [name]` },
    ],
  },
  {
    tab: 'services', label: 'Services', commands: [
      { name: 'List', msg: 'To list the service instances in the targeted space:', syntax: () => 'cf services' },
      { name: 'Bind', msg: 'To bind a service instance to the application:', syntax: c => `cf bind-service ${app(c)} [service instance]` },
      { name: 'Unbind', msg: 'To unbind a service instance from the application:', syntax: c => `cf unbind-service ${app(c)} [service instance]` },
    ],
  },
  {
    tab: 'events', label: 'Events', commands: [
      { name: 'List', msg: 'To show the application events:', syntax: c => `cf events ${app(c)}` },
    ],
  },
];

export const SPACE_CLI_COMMANDS: CliTabCommands[] = [
  {
    tab: 'summary', label: 'Summary', commands: [
      { name: 'Information', msg: 'To fetch space information:', syntax: c => `cf space ${space(c)}` },
      { name: 'Rename', msg: 'To rename a space:', syntax: c => `cf rename-space ${space(c)} "[name]"` },
    ],
  },
  {
    tab: 'apps', label: 'Applications', commands: [
      { name: 'List', msg: 'To list the applications in the targeted space:', syntax: () => 'cf apps' },
    ],
  },
  {
    tab: 'service-instances', label: 'Services', commands: [
      { name: 'List', msg: 'To list the service instances in the targeted space:', syntax: () => 'cf services' },
      { name: 'Marketplace', msg: 'To list the services available in the marketplace:', syntax: () => 'cf marketplace' },
    ],
  },
  {
    tab: 'user-service-instances', label: 'User Services', commands: [
      { name: 'List', msg: 'To list the service instances in the targeted space:', syntax: () => 'cf services' },
      { name: 'Create', msg: 'To create a user-provided service instance:', syntax: () => 'cf create-user-provided-service [name]' },
    ],
  },
  {
    tab: 'routes', label: 'Routes', commands: [
      { name: 'List', msg: 'To list the routes in the targeted space:', syntax: () => 'cf routes' },
      { name: 'Create', msg: 'To create a route in the targeted space:', syntax: () => 'cf create-route [domain] --hostname [host]' },
      { name: 'Delete', msg: 'To delete a route:', syntax: () => 'cf delete-route [domain] --hostname [host]' },
    ],
  },
  {
    tab: 'users', label: 'Users', commands: [
      { name: 'Users', msg: "List each space role's users:", syntax: c => `cf space-users ${org(c)} ${space(c)}` },
      { name: 'Set role', msg: 'To give a user a space role:', syntax: c => `cf set-space-role [user] ${org(c)} ${space(c)} [role]` },
    ],
  },
  {
    tab: 'space-quota', label: 'Quota', commands: [
      { name: 'List', msg: 'To list the space quotas of the targeted org:', syntax: () => 'cf space-quotas' },
    ],
  },
];

export const ORGANIZATION_CLI_COMMANDS: CliTabCommands[] = [
  {
    tab: 'summary', label: 'Summary', commands: [
      { name: 'Information', msg: 'To fetch org information:', syntax: c => `cf org ${org(c)}` },
      { name: 'Rename', msg: 'To rename an org:', syntax: c => `cf rename-org ${org(c)} "[name]"` },
    ],
  },
  {
    tab: 'spaces', label: 'Spaces', commands: [
      { name: 'List', msg: 'To list the spaces in the targeted org:', syntax: () => 'cf spaces' },
      { name: 'Create', msg: 'To create a space in the org:', syntax: c => `cf create-space [name] -o ${org(c)}` },
    ],
  },
  {
    tab: 'users', label: 'Users', commands: [
      { name: 'Users', msg: "List each org role's users:", syntax: c => `cf org-users ${org(c)}` },
      { name: 'Set role', msg: 'To give a user an org role:', syntax: c => `cf set-org-role [user] ${org(c)} [role]` },
    ],
  },
  {
    tab: 'quota', label: 'Quota', commands: [
      { name: 'List', msg: 'To list the org quotas:', syntax: () => 'cf org-quotas' },
      { name: 'Information', msg: 'To show an org quota:', syntax: () => 'cf org-quota [name]' },
    ],
  },
  {
    tab: 'space-quota-definitions', label: 'Space Quotas', commands: [
      { name: 'List', msg: 'To list the space quotas of the targeted org:', syntax: () => 'cf space-quotas' },
    ],
  },
];

export const CLOUD_FOUNDRY_CLI_COMMANDS: CliTabCommands[] = [
  {
    tab: 'summary', label: 'Summary', commands: [
      { name: 'Orgs', msg: 'To list all orgs:', syntax: () => 'cf orgs' },
    ],
  },
  {
    tab: 'organizations', label: 'Organizations', commands: [
      { name: 'List', msg: 'To list all orgs:', syntax: () => 'cf orgs' },
      { name: 'Create', msg: 'To create an org:', syntax: () => 'cf create-org [name]' },
    ],
  },
  {
    tab: 'marketplace', label: 'Marketplace', commands: [
      { name: 'List', msg: 'To list the services available in the marketplace:', syntax: () => 'cf marketplace' },
    ],
  },
  {
    tab: 'routes', label: 'Routes', commands: [
      { name: 'List', msg: 'To list the routes of every space in the targeted org:', syntax: () => 'cf routes --org-level' },
    ],
  },
  {
    tab: 'feature-flags', label: 'Feature Flags', commands: [
      { name: 'List', msg: 'To list the feature flags:', syntax: () => 'cf feature-flags' },
      { name: 'Information', msg: 'To show a feature flag:', syntax: () => 'cf feature-flag [name]' },
    ],
  },
  {
    tab: 'build-packs', label: 'Build Packs', commands: [
      { name: 'List', msg: 'To list the buildpacks:', syntax: () => 'cf buildpacks' },
    ],
  },
  {
    tab: 'stacks', label: 'Stacks', commands: [
      { name: 'List', msg: 'To list the stacks:', syntax: () => 'cf stacks' },
      { name: 'Information', msg: 'To show a stack:', syntax: () => 'cf stack [name]' },
    ],
  },
  {
    tab: 'security-groups', label: 'Security Groups', commands: [
      { name: 'List', msg: 'To list the security groups:', syntax: () => 'cf security-groups' },
      { name: 'Information', msg: 'To show a security group:', syntax: () => 'cf security-group [name]' },
      { name: 'Running', msg: 'To list the security groups applied to running applications:', syntax: () => 'cf running-security-groups' },
      { name: 'Staging', msg: 'To list the security groups applied to staging applications:', syntax: () => 'cf staging-security-groups' },
    ],
  },
  {
    tab: 'quota-definitions', label: 'Organization Quotas', commands: [
      { name: 'List', msg: 'To list the org quotas:', syntax: () => 'cf org-quotas' },
      { name: 'Information', msg: 'To show an org quota:', syntax: () => 'cf org-quota [name]' },
    ],
  },
];
