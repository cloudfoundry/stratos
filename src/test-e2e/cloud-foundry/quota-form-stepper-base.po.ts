import { StepperComponent } from '../po/stepper.po';


export class QuotaFormStepperBase extends StepperComponent {
  private name = 'name';
  private totalServices = 'totalservices';
  private totalRoutes = 'totalroutes';
  private memoryLimit = 'memorylimit';
  private instanceMemoryLimit = 'instancememorylimit';
  private nonBasicServicesAllowed = 'nonbasicservicesallowed';
  private totalReservedRoutePorts = 'totalreservedrouteports';
  private appInstanceLimit = 'appinstancelimit';

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
