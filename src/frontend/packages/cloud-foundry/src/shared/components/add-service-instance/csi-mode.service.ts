import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, defer, firstValueFrom, from, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { SpaceScopedService } from '../../../../../cloud-foundry/src/features/service-catalog/services-helper';
import { getIdFromRoute } from '../../../../../core/src/core/utils.service';
import { TailwindSnackBarService } from '../../../../../core/src/shared/services/tailwind-snackbar.service';
import { StratosJobError } from '../../../services/async-jobs/async-job.types';
import { writeWithJob } from '../../../services/async-jobs/write-with-job';
import { EndpointDataRegistry } from '../../../services/endpoint-data/endpoint-data.registry';

export enum CreateServiceInstanceMode {
  MARKETPLACE_MODE = 'marketPlaceMode',
  APP_SERVICES_MODE = 'appServicesMode',
  SERVICES_WALL_MODE = 'servicesWallMode',
  EDIT_SERVICE_INSTANCE_MODE = 'editServiceInstanceMode'
}

export const enum CreateServiceFormMode {
  CreateServiceInstance = 'create-service-instance',
  BindServiceInstance = 'bind-service-instance',
}

/**
 * Where should the user be taken on cancel (and success). If not supplied will fall back on previous location and then deduced from
 * params
 */
export const CSI_CANCEL_URL = 'cancel';

/**
 * Used when `CSI_CANCEL_URL` is not supplied
 */
export const CANCEL_SPACE_ID_PARAM = 'space-guid';
/**
 * Used when `CSI_CANCEL_URL` is not supplied
 */
export const CANCEL_ORG_ID_PARAM = 'org-guid';
/**
 * Used when `CSI_CANCEL_URL` is not supplied
 */
export const CANCEL_USER_PROVIDED = 'up';

interface ViewDetail {
  showSelectCf: boolean;
  showSelectService: boolean;
  showSelectServicePlan: boolean;
  showBindApp: boolean;
  showSpecifyDetails: boolean;
}

const defaultViewDetail = {
  showSelectCf: true,
  showSelectService: true,
  showSelectServicePlan: true,
  showBindApp: true,
  showSpecifyDetails: true
};

@Injectable({
  providedIn: 'root'
})
export class CsiModeService {
  private activatedRoute = inject(ActivatedRoute);
  private http = inject(HttpClient);
  private snackBar = inject(TailwindSnackBarService);
  private endpointDataRegistry = inject(EndpointDataRegistry);


  private mode!: string;
  public viewDetail!: ViewDetail;
  /**
   * Where should the user be taken on cancel (and success). Taken from url param, previous location or deduced
   */
  public cancelUrl: string;
  // This property is only used when launching the Create Service Instance Wizard from the Marketplace
  spaceScopedDetails: SpaceScopedService = { isSpaceScoped: false };

  constructor() {
    const activatedRoute = this.activatedRoute;
    const router = inject(Router);

    const serviceId = getIdFromRoute(activatedRoute, 'serviceId');
    const serviceInstanceId = getIdFromRoute(activatedRoute, 'serviceInstanceId');
    this.cancelUrl = `/services`;
    const spaceGuid = activatedRoute.snapshot.queryParams[CANCEL_SPACE_ID_PARAM];
    const orgGuid = activatedRoute.snapshot.queryParams[CANCEL_ORG_ID_PARAM];
    const isUserProvided = activatedRoute.snapshot.queryParams[CANCEL_USER_PROVIDED];
    const cfId = getIdFromRoute(activatedRoute, 'endpointId');
    // App id when in create instance from app page mode
    const id = getIdFromRoute(activatedRoute, 'id');

    // Needs tidying up, see #4051

    // Started stepper from the marketplace-->service page
    if (!!serviceId && !!cfId) {
      this.mode = CreateServiceInstanceMode.MARKETPLACE_MODE;
      this.cancelUrl = `/marketplace/${cfId}/${serviceId}/instances`;
      this.viewDetail = {
        ...defaultViewDetail,
        showSelectService: false,
      };
      this.spaceScopedDetails = {
        isSpaceScoped: activatedRoute.snapshot.queryParams.isSpaceScoped === 'true' ? true : false,
        spaceGuid: activatedRoute.snapshot.queryParams.spaceGuid,
        orgGuid: activatedRoute.snapshot.queryParams.orgGuid,
      };
    }

    // Started stepper with a service instance... so in edit mode
    if (!!serviceInstanceId && !!cfId) {
      this.mode = CreateServiceInstanceMode.EDIT_SERVICE_INSTANCE_MODE;
      this.viewDetail = {
        ...defaultViewDetail,
        showSelectCf: false,
        showSelectService: false,
        showBindApp: false
      };
      // App id when in edit service instance mode
      const appId = this.activatedRoute.snapshot.queryParams.appId;
      if (appId) {
        this.cancelUrl = `/applications/${cfId}/${appId}/services`;
      }

    }

    // Started stepper in stepper tile selector in app mode
    if (!!id && !!cfId) {
      this.mode = CreateServiceInstanceMode.APP_SERVICES_MODE;
      this.viewDetail = {
        ...defaultViewDetail,
        showSelectCf: false,
      };
      this.cancelUrl = `/applications/${cfId}/${id}/services`;
    }

    // Started stepper from the root service instance list. In this top-down
    // flow the user is creating the instance before knowing which app to bind
    // to, and many brokers provision service instances asynchronously — the
    // inline "bind to app" step would fail for async services before the
    // instance is ready. Hide the bind step; the user can bind later once the
    // instance shows as running in the services wall.
    if (!cfId) {
      this.mode = CreateServiceInstanceMode.SERVICES_WALL_MODE;
      this.viewDetail = {
        ...defaultViewDetail,
        showBindApp: false,
      };
    }

    // Started stepper from a space's service instance list
    if (spaceGuid && orgGuid) {
      this.cancelUrl =
        // tslint:disable-next-line:max-line-length
        `/cloud-foundry/${cfId}/organizations/${orgGuid}/spaces/${spaceGuid}/${isUserProvided ? 'user-service-instances' : 'service-instances'}`;
    }

    this.updateCancelUrl(this.activatedRoute, router);
  }

  getViewDetail = () => this.viewDetail;

  isMarketplaceMode = () => this.mode === CreateServiceInstanceMode.MARKETPLACE_MODE;
  isAppServicesMode = () => this.mode === CreateServiceInstanceMode.APP_SERVICES_MODE;
  isServicesWallMode = () => this.mode === CreateServiceInstanceMode.SERVICES_WALL_MODE;
  isEditServiceInstanceMode = () => this.mode === CreateServiceInstanceMode.EDIT_SERVICE_INSTANCE_MODE;


  public createApplicationServiceBinding(
    serviceInstanceGuid: string,
    cfGuid: string,
    appGuid: string,
    params: object,
  ): Observable<{ success: boolean; message?: string }> {
    return defer(() => from(this.bindWithProvisioningWait(serviceInstanceGuid, cfGuid, appGuid, params)));
  }

  // Bind, with a brief in-line wait (15s) that handles fast brokers without
  // adding latency. If the SI is still "in progress" past that window we
  // detach: return success now so the wizard can navigate to /services, and
  // continue polling+retrying the bind in the background. A sticky snackbar
  // reports the final outcome (succeeded / failed / give-up after long timeout).
  private async bindWithProvisioningWait(
    serviceInstanceGuid: string,
    cfGuid: string,
    appGuid: string,
    params: object,
    inlineWaitMs = 15_000,
    backgroundWaitMs = 600_000,
  ): Promise<{ success: boolean; message?: string }> {
    const body: Record<string, unknown> = {
      type: 'app',
      relationships: {
        app: { data: { guid: appGuid } },
        service_instance: { data: { guid: serviceInstanceGuid } },
      },
    };
    if (params && Object.keys(params).length > 0) {
      body['parameters'] = params;
    }
    const fireBind = async () => {
      await writeWithJob<unknown>(
        this.http,
        this.http.post(`/pp/v1/cf/service_bindings/${cfGuid}`, body, { observe: 'response' }),
      );
      // A new binding changes the app's services and the SI's boundApps —
      // fire the serviceBinding.create cascade (apps + serviceInstances) so
      // sticky readers like the services-wall pre-seed refetch instead of
      // resurrecting pre-bind rows. Restores the legacy
      // serviceInstanceReducer cross-entity update as cache invalidation;
      // covers both the inline and the background-retry bind paths.
      this.endpointDataRegistry.peek(cfGuid)?.applyCascade('serviceBinding.create');
    };

    try {
      await fireBind();
      return { success: true };
    } catch (err: unknown) {
      if (!isOperationInProgressError(err)) {
        return { success: false, message: extractErrorMessage(err) };
      }
    }

    // SI is still provisioning. Try a brief wait first — many brokers settle
    // in under 15s so we can keep the bind synchronous to the wizard.
    this.snackBar.open('Service instance is still provisioning — waiting before binding…', undefined, { duration: 10_000 });
    const settled = await this.waitForServiceInstanceReady(cfGuid, serviceInstanceGuid, inlineWaitMs);
    if (settled.state === 'failed') {
      return { success: false, message: settled.detail || 'Service broker rejected the create' };
    }
    if (settled.state === 'succeeded') {
      try {
        await fireBind();
        return { success: true };
      } catch (err: unknown) {
        return { success: false, message: extractErrorMessage(err) };
      }
    }
    // Slow broker. Detach the bind so the wizard doesn't keep spinning;
    // background poll + retry bind, and surface the outcome via snackbar
    // when CF settles. The user is free to navigate away in the meantime.
    void this.runBindInBackground(serviceInstanceGuid, cfGuid, appGuid, fireBind, backgroundWaitMs);
    return { success: true };
  }

  private async runBindInBackground(
    siGuid: string,
    cfGuid: string,
    appGuid: string,
    fireBind: () => Promise<unknown>,
    waitMs: number,
  ): Promise<void> {
    this.snackBar.open(
      'Service instance still provisioning. Bind will retry automatically when ready.',
      undefined,
      { duration: 10_000 },
    );
    const settled = await this.waitForServiceInstanceReady(cfGuid, siGuid, waitMs);
    if (settled.state === 'succeeded') {
      try {
        await fireBind();
        this.snackBar.open(`Service instance bound to app.`, undefined, { duration: 10_000 });
      } catch (err: unknown) {
        this.snackBar.error(`Service instance ready, but bind failed: ${extractErrorMessage(err)}`);
      }
      return;
    }
    if (settled.state === 'failed') {
      this.snackBar.error(`Service instance create failed: ${settled.detail || 'broker rejected the create'}`);
      return;
    }
    this.snackBar.error('Service instance still provisioning after the auto-bind window. Bind it manually from the Services tab.');
  }

  private async waitForServiceInstanceReady(
    cfGuid: string,
    siGuid: string,
    waitMs: number,
  ): Promise<{ state: string; detail: string }> {
    const url = `/pp/v1/cf/service_instances/${cfGuid}/${siGuid}`;
    const deadline = Date.now() + waitMs;
    const intervalMs = 3_000;
    while (Date.now() < deadline) {
      try {
        const si = await firstValueFrom(this.http.get<{ lastOperation?: { state?: string; description?: string } }>(url));
        const op = si?.lastOperation;
        const state = op?.state ?? '';
        if (state === 'succeeded' || state === 'failed') {
          return { state, detail: op?.description ?? '' };
        }
      } catch {
        // Transient — try again until deadline.
      }
      await new Promise(r => setTimeout(r, intervalMs));
    }
    return { state: 'in progress', detail: '' };
  }



  private updateCancelUrl(
    activatedRoute: ActivatedRoute,
    router: Router
  ) {
    // cancelUrl determines where we go on cancel AND success
    const cancelUrl = activatedRoute.snapshot.queryParamMap.get(CSI_CANCEL_URL);
    if (cancelUrl) {
      // Override cancelUrl with what's been passed in (probably came from the service selection pre-step)
      this.cancelUrl = cancelUrl;
    } else {
      // There's some holes with the way cancelUrl in ctor is calculated
      // - marketplace/service/instances list --> cancel goes to space service instance list
      // - marketplace/service create instance --> cancel goes to marketplace/service/instance regardless of starting tab
      // - .. others??
      // For simplicity always go back to the previous location
      // - good catch all
      // - doesn't work that well for marketplace/service create instance --> success (should go to marketplace/service/instance)
      // - if user has refreshed on stepper (previous url was login) use the old cancelUrl best-guess value
      const currentNavigation = router.getCurrentNavigation();
      if (currentNavigation &&
        currentNavigation.previousNavigation &&
        currentNavigation.previousNavigation.finalUrl &&
        currentNavigation.previousNavigation.finalUrl.toString() !== '/login'
      ) {
        this.cancelUrl = currentNavigation.previousNavigation.finalUrl.toString();
      }
    }
  }

}

// Detect CF's "operation in progress" reject. CF returns 422 with the
// generic CF-UnprocessableEntity title (code 10008) when a bind/update
// lands while the SI's last_operation is still in progress; the
// distinguishing signal is the detail message itself, not the code
// (10008 covers many other cases). Treated as deferred, not failed:
// the caller polls the SI and retries the bind once last_op = succeeded.
function isOperationInProgressError(err: unknown): boolean {
  if (!(err instanceof HttpErrorResponse)) return false;
  if (err.status !== 422) return false;
  const body = err.error;
  if (!body || typeof body !== 'object') return false;
  const errors = (body as { errors?: Array<{ detail?: string }> }).errors;
  const first = errors?.[0];
  return typeof first?.detail === 'string' && first.detail.includes('operation in progress');
}

function extractErrorMessage(err: unknown): string {
  if (err instanceof StratosJobError) return err.message;
  if (err instanceof HttpErrorResponse) {
    const body = err.error;
    if (body && typeof body === 'object') {
      // Handles three backend shapes: CF passthrough errors[].detail/title,
      // Stratos job envelope errors[].message, and handleCapiError's
      // top-level {error}. Without this the user sees Angular's generic
      // "Http failure response for ... 502 OK" with no clue what broke.
      const errors = (body as { errors?: Array<{ detail?: unknown; title?: string; message?: string }> }).errors;
      const first = errors?.[0];
      if (first) {
        if (typeof first.detail === 'string' && first.detail) return first.detail;
        if (first.title) return first.title;
        if (first.message) return first.message;
      }
      const top = body as { message?: string; error?: string };
      if (top.message) return top.message;
      if (top.error) return top.error;
    }
    if (typeof body === 'string' && body) return body;
    return err.statusText && err.statusText !== 'OK'
      ? `HTTP ${err.status} ${err.statusText}`
      : `HTTP ${err.status}`;
  }
  if (err instanceof Error) return err.message;
  return 'unknown error';
}
