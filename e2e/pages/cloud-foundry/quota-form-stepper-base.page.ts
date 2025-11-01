import { Page } from '@playwright/test';
import { StepperBase } from '../../helpers/stepper-base';

/**
 * Quota Form Stepper Base
 * Base class for quota form steppers (org and space quotas)
 */
export class QuotaFormStepperBase extends StepperBase {
  public name = 'name';
  public totalServices = 'totalservices';
  public totalRoutes = 'totalroutes';
  public memoryLimit = 'memorylimit';
  public instanceMemoryLimit = 'instancememorylimit';
  public nonBasicServicesAllowed = 'nonbasicservicesallowed';
  public totalReservedRoutePorts = 'totalreservedrouteports';
  public appInstanceLimit = 'appinstancelimit';

  constructor(page: Page) {
    super(page);
  }

  async setName(name: string): Promise<void> {
    await this.fillStepperField(this.name, name);
  }

  async setTotalServices(totalServices: string): Promise<void> {
    await this.fillStepperField(this.totalServices, totalServices);
  }

  async setTotalRoutes(totalRoutes: string): Promise<void> {
    await this.fillStepperField(this.totalRoutes, totalRoutes);
  }

  async setMemoryLimit(memoryLimit: string): Promise<void> {
    await this.fillStepperField(this.memoryLimit, memoryLimit);
  }

  async setInstanceMemoryLimit(instanceMemoryLimit: string): Promise<void> {
    await this.fillStepperField(this.instanceMemoryLimit, instanceMemoryLimit);
  }

  async setTotalReservedRoutePorts(totalReservedRoutePorts: string): Promise<void> {
    await this.fillStepperField(this.totalReservedRoutePorts, totalReservedRoutePorts);
  }

  async setAppInstanceLimit(appInstanceLimit: string): Promise<void> {
    await this.fillStepperField(this.appInstanceLimit, appInstanceLimit);
  }
}
