export class SSOHelper {

  // Is SSO Login enabled?
  public ssoEnabled = false;

  // Only need to fetch this once
  public ssoEnabledFetched = false;

}

export const ssoHelper = new SSOHelper();
