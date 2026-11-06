/** Paths for saved authentication state (created by auth.setup.ts) */
export const ADMIN_STATE = 'e2e/.auth/admin.json';
export const USER_STATE = 'e2e/.auth/user.json';

/**
 * Path for persisted CF org/space GUIDs (created by auth.setup.ts).
 * Keyed by CF endpoint name: { "<endpointName>": { orgGuid, spaceGuid } }.
 */
export const CF_GUIDS_FILE = 'e2e/.auth/cf-guids.json';

/**
 * The CF roles the role projects log in as (see auth.roles.setup.ts and the
 * `role-*` projects in playwright.config.ts). Each has its own saved session.
 */
export const CF_ROLES = ['orgManager', 'spaceManager', 'orgAuditor', 'spaceAuditor'] as const;
export type CfRole = typeof CF_ROLES[number];

/** Saved session for a role project, e.g. e2e/.auth/role-orgManager.json */
export const roleStatePath = (role: CfRole): string => `e2e/.auth/role-${role}.json`;

/** Playwright project name for a role, e.g. 'role-org-manager'. */
export const roleProjectName = (role: CfRole): string =>
  'role-' + role.replace(/[A-Z]/g, c => '-' + c.toLowerCase());

/** Spec directory under e2e/tests/roles/ for a role, e.g. 'org-manager'. */
export const roleSpecDir = (role: CfRole): string => roleProjectName(role).slice('role-'.length);

export const roleFromProjectName = (name: string): CfRole | undefined =>
  CF_ROLES.find(role => roleProjectName(role) === name);
