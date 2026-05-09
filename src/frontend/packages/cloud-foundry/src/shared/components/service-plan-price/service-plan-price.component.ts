import { CommonModule, registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import { Component, Input, ChangeDetectionStrategy } from '@angular/core';

import { StServicePlan, StServicePlanCost } from '../../../services/endpoint-data/stratos-types';


@Component({
  selector: 'app-service-plan-price',
  templateUrl: './service-plan-price.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    // Note: CurrencyPipe is provided by CommonModule
  ]
})
export class ServicePlanPriceComponent {

  @Input() servicePlan!: StServicePlan;

  constructor() {
    // Locale registration is required for the currency pipe to format
    // EUR amounts in French locale conventions. This was historically
    // tied to the open-service-broker `extra` JSON pattern; under V3
    // costs come typed at top level and the locale heuristic remains.
    registerLocaleData(localeFr);
  }

  // V3 StServicePlanCost: { amount: number, currency: string, unit: string }.
  // Currency drives the per-cost locale (EUR formats in French style; rest
  // fall through to en-US). Symbol resolution is delegated to the `currency`
  // pipe in the template.
  protected getCostValue = (cost: StServicePlanCost): number => cost.amount;

  protected getCostCurrency = (cost: StServicePlanCost): string => (cost.currency || '').toUpperCase();

  protected getCurrencyLocale = (cost: StServicePlanCost): string =>
    this.getCostCurrency(cost) === 'EUR' ? 'fr' : 'en-US';
}
