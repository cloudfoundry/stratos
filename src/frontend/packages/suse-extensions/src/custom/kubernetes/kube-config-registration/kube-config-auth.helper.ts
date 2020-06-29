import { ComponentFactoryResolver, Injector } from '@angular/core';
import { FormBuilder } from '@angular/forms';

import { ConnectEndpointData } from '../../../../../core/src/features/endpoints/connect.service';
import { RowState } from '../../../../../core/src/shared/components/list/data-sources-controllers/list-data-source-types';
import { entityCatalog } from '../../../../../store/src/entity-catalog/entity-catalog';
import { EndpointAuthTypeConfig, IAuthForm } from '../../../../../store/src/extension-types';
import { KUBERNETES_ENDPOINT_TYPE } from '../kubernetes-entity-factory';
import { KubeConfigFileCluster, KubeConfigFileUser } from './kube-config.types';

/**
 * Auth helper tries to figure out the Kubernetes sub-type and auth to use
 * based on the kube config file contents
 */
export class KubeConfigAuthHelper {

  authTypes: { [name: string]: EndpointAuthTypeConfig } = {};

  public subTypes = [];

  constructor() {
    const epTypeInfo = entityCatalog.getAllEndpointTypes(false);
    const k8s = epTypeInfo.find(entity => entity.type === KUBERNETES_ENDPOINT_TYPE);
    if (k8s && k8s.definition) {
      const defn = k8s.definition;

      // Collect all of the auth types
      defn.authTypes.forEach(at => {
        this.authTypes[at.value] = at;
      });

      this.subTypes.push({ id: '', name: 'Generic' });

      // Collect all of the auth types for the sub-types
      defn.subTypes.forEach(st => {
        if (st.type !== 'config') {
          this.subTypes.push({ id: st.type, name: st.labelShort });
        }
        st.authTypes.forEach(at => {
          this.authTypes[at.value] = at;
        });
      });

      // Sort the subtypes
      this.subTypes = this.subTypes.sort((a, b) => a.name.localeCompare(b.name));
    }
  }

  // Try and parse the authentication metadata
  public parseAuth(cluster: KubeConfigFileCluster, user: KubeConfigFileUser): RowState {

    // Default subtype is generic Kubernetes ('') or previously determined/selected sub type
    cluster._subType = cluster._subType || '';

    // Certificate authentication first

    // In-file certificate authentication
    if (user.user['client-certificate-data'] && user.user['client-key-data']) {
      // We are good to go - create the form data

      // Default is generic kubernetes
      let subType = '';
      const authType = 'kube-cert-auth';
      if (cluster.cluster.server.indexOf('azmk8s.io') >= 0) {
        // Probably Azure
        subType = 'aks';
        cluster._subType = 'aks';
      }

      const authData = {
        authType,
        subType,
        values: {
          cert: user.user['client-certificate-data'],
          certKey: user.user['client-key-data']
        }
      };
      user._authData = authData;
      return {};
    }

    if (user.user['client-certificate'] || user.user['client-key']) {
      cluster._additionalUserInfo = true;
      return {
        message: 'This endpoint will be registered but not connected (additional information is required)',
        info: true
      };
    }

    const authProvider = user.user['auth-provider'];


    if (authProvider && authProvider.config) {
      if (authProvider.config['cmd-path'] && authProvider.config['cmd-path'].indexOf('gcloud') !== -1) {
        // GKE
        cluster._subType = 'gke';
        // Can not connect to GKE - user must do so manually
        cluster._additionalUserInfo = true;
        return {
          message: 'This endpoint will be registered but not connected (additional information is required)',
          info: true
        };
      }
    }

    if (
      cluster.cluster.server.indexOf('eks.amazonaws.com') >= 0 ||
      (user.user.exec && user.user.exec.command && user.user.exec.command === 'aws-iam-authenticator')
    ) {
      // Probably EKS
      cluster._subType = 'eks';
      cluster._additionalUserInfo = true;
      return {
        message: 'This endpoint will be registered but not connected (additional information is required)',
        info: true
      };
    }

    return { message: 'Authentication mechanism is not supported', warning: true };
  }

  // Use the auto component to get the data in the correct format for connecting to the endpoint
  public getAuthDataForConnect(resolver: ComponentFactoryResolver, injector: Injector, fb: FormBuilder, user: KubeConfigFileUser)
    : ConnectEndpointData | null {

    let data = null;

    // Get the component to us
    if (user && user._authData) {
      const authType = this.authTypes[user._authData.authType];

      const factory = resolver.resolveComponentFactory<IAuthForm>(authType.component);

      const ref = factory.create(injector);

      const form = fb.group({
        authType: authType.value,
        systemShared: false,
        authValues: fb.group(user._authData.values)
      });

      ref.instance.formGroup = form;

      // Allow the auth form to supply body content if it needs to
      const endpointFormInstance = ref.instance as any;
      if (endpointFormInstance.getBody && endpointFormInstance.getValues) {
        data = {
          authType: authType.value,
          authVal: endpointFormInstance.getValues(user._authData.values),
          systemShared: false,
          bodyContent: endpointFormInstance.getBody()
        };
      }
      ref.destroy();
    }
    return data;
  }
}
