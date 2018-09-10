import { ApplicationBasePage } from './application-page.po';
import { CardAppBuildInfo } from './card-app-build-info.po';
import { CardAppCfInfo } from './card-app-cf-info.po';
import { CardAppDeployInfo } from './card-app-deploy-info.po';
import { CardAppInfo } from './card-app-info.po';
import { CardAppInstances } from './card-app-instances.po';
import { CardAppStatus } from './card-app-status.po';
import { CardAppUptime } from './card-app-uptime.po';

export class ApplicationPageSummaryTab extends ApplicationBasePage {

  cardStatus: CardAppStatus;
  cardInstances: CardAppInstances;
  cardUptime: CardAppUptime;
  cardInfo: CardAppInfo;
  cardCfInfo: CardAppCfInfo;
  cardBuildInfo: CardAppBuildInfo;
  cardDeployInfo: CardAppDeployInfo;

  constructor(public cfGuid: string, public appGuid: string) {
    super(cfGuid, appGuid, 'summary');
    this.cardStatus = new CardAppStatus();
    this.cardInstances = new CardAppInstances();
    this.cardUptime = new CardAppUptime();
    this.cardInfo = new CardAppInfo();
    this.cardCfInfo = new CardAppCfInfo();
    this.cardBuildInfo = new CardAppBuildInfo();
    this.cardDeployInfo = new CardAppDeployInfo();
  }

}
