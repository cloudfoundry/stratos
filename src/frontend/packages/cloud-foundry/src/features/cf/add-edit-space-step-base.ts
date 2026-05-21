import { AbstractControl, ValidatorFn } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Signal, computed } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { StepOnNextResult } from '@stratosui/core';
import { OrgDataRegistry } from '../../services/endpoint-data/org-data.registry';
import { QuotaDataService } from '../../services/endpoint-data/quota-data.service';
import { StSpaceQuota } from '../../services/endpoint-data/stratos-types';
import { ActiveRouteCfOrgSpace } from './cf-page.types';

export class AddEditSpaceStepBase {
  orgGuid: string;
  cfGuid: string;
  /** Name uniqueness check; subclasses implement. Used by spaceNameTakenValidator. */
  isNameUnique!: (spaceName: string) => boolean;

  readonly allSpacesInOrg: Signal<string[]>;
  readonly quotaDefinitions: Signal<StSpaceQuota[]>;
  readonly hasSpaceQuotas: Signal<boolean>;

  constructor(
    protected activatedRoute: ActivatedRoute,
    protected activeRouteCfOrgSpace: ActiveRouteCfOrgSpace,
    protected orgRegistry: OrgDataRegistry,
    protected quotaData: QuotaDataService,
  ) {
    this.cfGuid = activeRouteCfOrgSpace.cfGuid;
    this.orgGuid = activeRouteCfOrgSpace.orgGuid;

    const orgService = this.orgRegistry.acquire(this.cfGuid, this.orgGuid);
    orgService.load().subscribe();
    this.allSpacesInOrg = computed(() => orgService.spaces().map(s => s.name));

    const quotaSource = this.quotaData.spaceQuotasInOrg(this.cfGuid, this.orgGuid);
    this.quotaDefinitions = quotaSource.value;
    this.hasSpaceQuotas = computed(() => this.quotaDefinitions().length > 0);
  }

  destroy(): void {
    this.orgRegistry.release(this.cfGuid, this.orgGuid);
  }

  spaceNameTakenValidator = (): ValidatorFn => {
    return (formField: AbstractControl): { [key: string]: any } => {
      const nameValid = this.isNameUnique(formField.value);
      return !nameValid ? { spaceNameTaken: { value: formField.value } } : null;
    };
  }

  protected map(errorMessage: string):
    (source: Observable<{ error: boolean, message: string }>) => Observable<StepOnNextResult> {
    return map(o => ({
      success: !o.error,
      redirect: !o.error,
      message: o.error ? errorMessage + o.message : ''
    }));
  }
}
