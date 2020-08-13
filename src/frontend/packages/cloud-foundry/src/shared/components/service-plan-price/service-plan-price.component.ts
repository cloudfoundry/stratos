import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import { Component, Input } from '@angular/core';

import { APIResource } from '../../../../../store/src/types/api.types';
import { IServicePlan, IServicePlanCost } from '../../../cf-api-svc.types';


@Component({
  selector: 'app-service-plan-price',
  templateUrl: './service-plan-price.component.html',
  styleUrls: ['./service-plan-price.component.scss']
})
export class ServicePlanPriceComponent {

  @Input() servicePlan: APIResource<IServicePlan>;

  constructor() {
    registerLocaleData(localeFr);
  }

  /*
 * Pick the first country listed in the amount object. It's unclear whether there could be a different number of these depending on
 * which region the CF is being served from (IBM seem to charge different amounts per country)
 */
  private getCountryCode = (cost: IServicePlanCost): string => Object.keys(cost.amount)[0];

  /*
   * Find the charge for the chosen country
   */
  protected getCostValue = (cost: IServicePlanCost) => cost.amount[this.getCountryCode(cost)];

  /*
   * Determine the currency for the chosen country
   */
  protected getCostCurrency = (cost: IServicePlanCost) => this.getCountryCode(cost).toUpperCase();

  /*
   * Artificially supply a locale for the chosen country.
   *
   * This will be updated once with do i18n
   */
  protected getCurrencyLocale = (cost: IServicePlanCost) => this.getCostCurrency(cost) === 'EUR' ? 'fr' : 'en-US';

}
