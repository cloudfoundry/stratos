import { StepperComponent } from '../po/stepper.po';


export class QuotaFormStepperBase extends StepperComponent {
  public name = 'name';
  public totalServices = 'totalservices';
  public totalRoutes = 'totalroutes';
  public memoryLimit = 'memorylimit';
  public instanceMemoryLimit = 'instancememorylimit';
  public nonBasicServicesAllowed = 'nonbasicservicesallowed';
  public totalReservedRoutePorts = 'totalreservedrouteports';
  public appInstanceLimit = 'appinstancelimit';

  setName(name: string) {
    this.getStepperForm().fill({ [this.name]: name });
  }

  setTotalServices(totalServices: string) {
    this.getStepperForm().fill({ [this.totalServices]: totalServices });
  }

  setTotalRoutes(totalRoutes: string) {
    this.getStepperForm().fill({ [this.totalRoutes]: totalRoutes });
  }

  setMemoryLimit(memoryLimit: string) {
    this.getStepperForm().fill({ [this.memoryLimit]: memoryLimit });
  }

  setInstanceMemoryLimit(instanceMemoryLimit: string) {
    this.getStepperForm().fill({ [this.instanceMemoryLimit]: instanceMemoryLimit });
  }

  setTotalReservedRoutePorts(totalReservedRoutePorts: string) {
    this.getStepperForm().fill({ [this.totalReservedRoutePorts]: totalReservedRoutePorts });
  }

  setAppInstanceLimit(appInstanceLimit: string) {
    this.getStepperForm().fill({ [this.appInstanceLimit]: appInstanceLimit });
  }
}
