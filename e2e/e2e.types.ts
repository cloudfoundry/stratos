export interface E2EConfig {
  consoleUsers: {
    admin: {
      username: string;
      password: string;
    },
    nonAdmin: {
      username: string;
      password: string;
    }
  };
}
