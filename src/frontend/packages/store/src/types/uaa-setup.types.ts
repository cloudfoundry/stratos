export interface UAASetupState {
  payload: {
    scope: string[],
    exp: number,
    user_id: string,
    user_name: string
  } | null;
  setup: boolean;
  error: boolean;
  message: string;
  settingUp: boolean;
}

export interface UaaSetupData {
  console_client: string;
  password: string;
  skip_ssl_validation: boolean;
  uaa_endpoint: string;
  username: string;
  console_client_secret?: string;
  use_sso: boolean;
  console_admin_scope?: string;
}

export interface LocalAdminSetupData {
  local_admin_password: string;
}
