export function getDefaultEndpointRoles(): ICfRolesState {
  return {
    global: {
      isAdmin: false,
      isReadOnlyAdmin: false,
      isGlobalAuditor: false,
      canRead: false,
      canWrite: false,
      scopes: []
    },
    spaces: {

    },
    organizations: {

    },
    state: getDefaultRolesRequestState()
  };
}