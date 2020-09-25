import {
  SERVICE_INSTANCE_TYPES,
} from '../../frontend/packages/cloud-foundry/src/shared/components/add-service-instance/add-service-instance-base-step/add-service-instance.types';
import { Page } from '../po/page.po';
import { SideNavMenuItem } from '../po/side-nav.po';
import { BaseCreateServiceInstanceStepper } from './base-create-service-instance-stepper.po';
import { CreateMarketplaceServiceInstance } from './create-marketplace-service-instance.po';
import { ServicesWallPage } from './services-wall.po';


export class CreateServiceInstance extends Page {

  private baseStepper = new BaseCreateServiceInstanceStepper();
  stepper: CreateMarketplaceServiceInstance;
  private servicesWall = new ServicesWallPage();

  public selectMarketplace() {
    return this.baseStepper.selectServiceType(SERVICE_INSTANCE_TYPES.SERVICE);
  }

  public selectUserProvidedService() {
    return this.baseStepper.selectServiceType(SERVICE_INSTANCE_TYPES.USER_SERVICE);
  }

  constructor(url = '/services/new') {
    super(url);
  }

  isActivePage() {
    return super.isActivePage(true);
  }

  waitForPage() {
    return super.waitForPage(undefined, true);
  }

  /**
   * Nav to stepper without reloading window
   */
  softNavigateTo() {
    this.sideNav.goto(SideNavMenuItem.Services);
    this.servicesWall.waitForPage();
    this.servicesWall.clickCreateServiceInstance();

    this.waitForPage();
  }

}
