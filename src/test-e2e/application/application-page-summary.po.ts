import { ApplicationBasePage } from './application-page.po';
import { CardAppBuildInfo } from './po/card-app-build-info.po';
import { CardAppCfInfo } from './po/card-app-cf-info.po';
import { CardAppDeployInfo } from './po/card-app-deploy-info.po';
import { CardAppInfo } from './po/card-app-info.po';
import { CardAppInstances } from './po/card-app-instances.po';
import { CardAppStatus } from './po/card-app-status.po';
import { CardAppUptime } from './po/card-app-uptime.po';

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
