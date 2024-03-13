import { NgModule } from '@angular/core';

import { CoreModule, MDAppModule, SharedModule } from '../../core/src/public-api';
import { HelmSetupModule } from './helm/helm.setup.module';
import { KubernetesSetupModule } from './kubernetes/kubernetes.setup.module';


@NgModule({
    imports: [
        CoreModule,
        SharedModule,
        MDAppModule,
        KubernetesSetupModule,
        HelmSetupModule,
    ],
    // FIXME: Ensure that anything lazy loaded/in kube endpoint pages is not included here - #3675
    declarations: []
})
export class KubePackageModule { }
