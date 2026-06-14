import { Injectable, signal, WritableSignal, inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import * as yaml from 'js-yaml';
import { combineLatest, Observable, of } from 'rxjs';
import { filter, map, take, tap } from 'rxjs/operators';

import { EndpointsService } from '../../../../core/src/core/endpoints.service';
import { createGuid } from '../../../../core/src/core/utils.service';
import { RowState } from '../../../../core/src/shared/components/signal-list/row-state.types';
import { getFullEndpointApiUrl } from '../../../../store/src/endpoint-utils';
import { EndpointModel } from '../../../../store/src/public-api';
import { KubeConfigAuthHelper } from './kube-config-auth.helper';
import { KubeConfigFile, KubeConfigFileCluster } from './kube-config.types';

/**
 * Signal wrapper providing dual API compatibility with BehaviorSubject
 * Allows gradual migration from BehaviorSubject to Signal patterns
 */
function createSignalWrapper<T>(initialValue: T) {
  const _signal = signal<T>(initialValue);
  const wrapper = Object.assign(
    // Make it callable like a signal
    () => _signal(),
    {
      // WritableSignal methods
      set: (value: T) => _signal.set(value),
      update: (fn: (value: T) => T) => _signal.update(fn),
      asReadonly: () => _signal.asReadonly(),
      // BehaviorSubject compatibility methods
      next: (value: T) => _signal.set(value),
      getValue: () => _signal(),
      asObservable: () => toObservable(_signal),
    }
  );
  return wrapper as WritableSignal<T> & {
    next: (value: T) => void;
    getValue: () => T;
    asObservable: () => Observable<T>;
  };
}

/**
 * Helper to parse the kubeconfig and transform it into data
 * that we can display in a table for selection
 *
 * Main issue is we only support one credential per endpoint, so need to format the data
 * to offer the user ability to select which user to import
 */
@Injectable()
export class KubeConfigHelper {
  endpointsService = inject(EndpointsService);


  authHelper = new KubeConfigAuthHelper();

  private _clusters = createSignalWrapper<KubeConfigFileCluster[] | null>(null);
  clusters$ = this._clusters.asObservable().pipe(
    filter(clusters => !!clusters)
  );

  public clustersChanged!: () => void;
  public update = (cluster: KubeConfigFileCluster) => {
    this.checkValidity(cluster).subscribe(() => this.clustersChanged());
  };

  public updateAll(): Observable<KubeConfigFileCluster[]> {
    return this.clusters$.pipe(
      tap(clusters => clusters.forEach(cluster => this.update(cluster))),
    );
  }

  public parse(config: string): Observable<string> {
    let doc: KubeConfigFile;

    const clusters: { [name: string]: KubeConfigFileCluster, } = {};

    try {
      doc = yaml.load(config) as KubeConfigFile;
    } catch (e) {
      return of(`${e}`);
    }

    // Need contexts, users and clusters
    if (!doc || !doc.contexts || !doc.users || !doc.clusters) {
      return of(`Configuration must have contexts, users and clusters`);
    }

    // Go through all of the contexts and find the clusters
    doc.contexts.forEach(ctx => {
      const cluster = doc.clusters.find(item => item.name === ctx.context.cluster);
      if (cluster) {
        // Found the cluster
        if (!clusters[cluster.name]) {
          const clstr: KubeConfigFileCluster = {
            ...cluster,
            _users: []
          };
          clusters[cluster.name] = clstr;
          clstr._state = createSignalWrapper<RowState>({});
        }

        // Get the user
        const user = doc.users.find(item => item.name === ctx.context.user);
        if (user) {
          // Check we don't already have this user (remove duplicates)
          const users = clusters[cluster.name]._users;
          if (users.findIndex(usr => usr.name === user.name) === -1) {
            clusters[cluster.name]._users.push(user);
            if (ctx.name === doc['current-context']) {
              // Auto-select this cluster/user if it is the current context
              clusters[cluster.name]._user = user.name;
              clusters[cluster.name]._selected = true;
            }
          }
        }
      }
    });

    // Go through all clusters, auto-select the user where this is only 1 and check validity
    const clustersArray = Object.values(clusters);
    clustersArray.forEach(cluster => {
      if (cluster._users.length >= 1) {
        cluster._user = cluster._users[0].name;
      }
      cluster._id = createGuid();
    });

    // Check validity
    return combineLatest(
      clustersArray.map(cluster => this.checkValidity(cluster))
    ).pipe(
      map(() => {
        // Notify cluster changes
        this.clustersChanged();
        this._clusters.next(Object.values(clusters));
        return '';
      })
    );
  }


  // Check the validity of a cluster for import
  public checkValidity(cluster: KubeConfigFileCluster): Observable<any> {
    // Check endpoint name
    return combineLatest([
      this.endpointsService.endpoints$,
      this._clusters.asObservable() // Might be called before we've loaded clusters, so used the non-filtered one
    ]).pipe(
      take(1),
      map(([eps, clusters]) => this.validate(Object.values(eps), cluster, clusters))
    );
  }

  private validate(endpoints: EndpointModel[], cluster: KubeConfigFileCluster, clusters: KubeConfigFileCluster[] | null) {
    cluster._invalid = false;
    let reset = true;

    const found = endpoints.find(item => item.name === cluster.name);
    if (found) {
      // If the URL is the same, then we will just connect to the existing endpoint
      if (getFullEndpointApiUrl(found) === cluster.cluster.server && !!cluster._user && !!found.guid) {
        cluster._guid = found.guid;
        cluster._state.next({
          message: 'This endpoint will be connected and not registered (endpoint is already registered)',
          info: true
        });
        reset = false;
      } else {
        // An endpoint with the same name (but different URL) already exists
        cluster._invalid = true;
        cluster._state.next({ message: 'An endpoint with this name already exists', warning: true });
      }
    } else {
      // Check endpoint url is not registered with a different name
      if (endpoints.find(item => getFullEndpointApiUrl(item) === cluster.cluster.server)) {
        cluster._invalid = true;
        cluster._state.next({ message: 'An endpoint with this URL already exists', warning: true });
      }
    }

    // Check the connection details
    if (!cluster._invalid && cluster._user) {
      const user = cluster._users.find(item => item.name === cluster._user);
      if (user) {
        const newState = this.authHelper.parseAuth(cluster, user);
        if (!!newState && !!newState.message) {
          reset = false;
          cluster._invalid = !!(newState.error || newState.warning);
          cluster._state.next(newState);
        }
      }
    }

    // Register only (_additionalUserInfo.. specific to text warning) is true
    // Connect only (endpoint exists) is true
    // Show special warning
    if (cluster._additionalUserInfo && cluster._guid) {
      cluster._invalid = true;
      reset = true;
      cluster._state.next({
        message: 'This endpoint will not be registered or connected (endpoint is already registered, additional information required to connect)',
        warning: true
      });
    }

    if (clusters && !!clusters.find(candidate => candidate.name === cluster.name && candidate._id !== cluster._id)) {
      cluster._invalid = true;
      cluster._state.next({ message: 'An endpoint with this name already exists in the config file', warning: true });
    }

    if (!cluster.name) {
      cluster._invalid = true;
      cluster._state.next({ message: 'Cluster must have name', warning: true });
    }

    // Cluster is valid, so clear any warning or error message
    if (!cluster._invalid && reset) {
      cluster._state.next({});
    }

    // Ensure invalid rows aren't selected (user cannot unselect invalid rows)
    if (cluster._invalid) {
      cluster._selected = false;
    }
  }
}
