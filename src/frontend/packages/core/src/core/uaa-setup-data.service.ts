import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable, Signal, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

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

export interface UaaSetupPayload {
  scope: string[];
  exp: number;
  user_id: string;
  user_name: string;
}

export interface UaaSetupState {
  payload: UaaSetupPayload | null;
  setup: boolean;
  error: boolean;
  message: string;
  settingUp: boolean;
}

const EMPTY_STATE: UaaSetupState = {
  payload: null,
  setup: false,
  error: false,
  message: '',
  settingUp: false,
};

const GET_SCOPES_URL = '/pp/v1/setup/check';
const SAVE_CONFIG_URL = '/pp/v1/setup/save';

/**
 * Signal-native UAA setup state. Replaces the @stratosui/store
 * `uaaSetup` slice (effects + reducer + actions) with HttpClient calls
 * and signals.
 *
 * `checkScopes` posts the credentials to /pp/v1/setup/check and stores
 * the returned scope payload. `saveConfig` posts to /pp/v1/setup/save
 * with the chosen admin scope. Both transition through `settingUp:true`
 * during the request and resolve to either `setup:true` (success) or
 * `error:true` (failure with `message`).
 */
@Injectable({ providedIn: 'root' })
export class UaaSetupDataService {
  private http = inject(HttpClient);

  private readonly _state = signal<UaaSetupState>(EMPTY_STATE);

  readonly state: Signal<UaaSetupState> = this._state.asReadonly();

  async checkScopes(setupData: UaaSetupData | LocalAdminSetupData): Promise<void> {
    await this.post(GET_SCOPES_URL, setupData, 'Failed to save configuration.');
  }

  async saveConfig(setupData: UaaSetupData | LocalAdminSetupData): Promise<void> {
    await this.post(SAVE_CONFIG_URL, setupData, 'Failed to setup Administrator scope.');
  }

  private async post(url: string, setupData: UaaSetupData | LocalAdminSetupData, failurePrefix: string): Promise<void> {
    this._state.set({
      ...this._state(),
      settingUp: true,
      setup: false,
      message: 'Setting up UAA',
      error: false,
    });

    const params = this.buildParams(setupData);
    try {
      const data = await firstValueFrom(
        this.http.post<Partial<UaaSetupPayload> | UaaSetupPayload | unknown>(url, params, {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        })
      );
      const merged: UaaSetupPayload = {
        ...(this._state().payload ?? ({} as UaaSetupPayload)),
        ...(data as Partial<UaaSetupPayload>),
      };
      this._state.set({
        payload: merged,
        setup: true,
        error: false,
        message: '',
        settingUp: false,
      });
    } catch (err) {
      this._state.set({
        ...this._state(),
        settingUp: false,
        setup: false,
        error: true,
        message: `${failurePrefix} ${this.fetchError(err)}`,
      });
    }
  }

  private buildParams(setupData: UaaSetupData | LocalAdminSetupData): HttpParams {
    let params = new HttpParams();
    if ((setupData as UaaSetupData).console_client) {
      const uaa = setupData as UaaSetupData;
      params = params
        .set('console_client', uaa.console_client)
        .set('username', uaa.username)
        .set('password', uaa.password)
        .set('skip_ssl_validation', uaa.skip_ssl_validation?.toString() ?? 'false')
        .set('uaa_endpoint', uaa.uaa_endpoint)
        .set('use_sso', uaa.use_sso?.toString() ?? 'false');
      if (uaa.console_client_secret) {
        params = params.append('console_client_secret', uaa.console_client_secret);
      }
      if (uaa.console_admin_scope) {
        params = params.set('console_admin_scope', uaa.console_admin_scope);
      }
    } else {
      const local = setupData as LocalAdminSetupData;
      params = params.set('local_admin_password', local.local_admin_password);
    }
    return params;
  }

  private fetchError(err: unknown): string {
    if (err instanceof HttpErrorResponse) {
      const body = err.error;
      if (body && typeof body === 'object' && body.error) {
        return body.error;
      }
      if (typeof body === 'string') {
        try {
          const parsed = JSON.parse(body);
          return typeof parsed === 'string' ? parsed : (parsed?.error ?? '');
        } catch {
          return body;
        }
      }
    }
    return '';
  }
}
