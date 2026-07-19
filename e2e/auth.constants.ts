/** Paths for saved authentication state (created by auth.setup.ts) */
export const ADMIN_STATE = 'e2e/.auth/admin.json';
export const USER_STATE = 'e2e/.auth/user.json';

/**
 * Path for persisted CF org/space GUIDs (created by auth.setup.ts).
 * Keyed by CF endpoint name: { "<endpointName>": { orgGuid, spaceGuid } }.
 */
export const CF_GUIDS_FILE = 'e2e/.auth/cf-guids.json';
