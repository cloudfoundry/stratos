import { Component, Input, OnInit, computed, inject, ChangeDetectionStrategy, ChangeDetectorRef, Injector, runInInjectionContext } from '@angular/core';
import { toSignal, toObservable } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import { AppState } from '@stratosui/store';
import { Observable } from 'rxjs';
import { take, map } from 'rxjs/operators';

import { HomePageCardLayout } from '../../../../core/src/features/home/home.types';
import { HomeCardShortcut } from '../../../../store/src/entity-catalog/entity-catalog.types';
import { EndpointModel } from '../../../../store/src/types/endpoint.types';
import { kubeEntityCatalog } from '../kubernetes-entity-generator';
import { KubernetesEndpointService } from '../services/kubernetes-endpoint.service';
import { TileGridComponent } from '../../../../core/src/shared/components/tile/tile-grid/tile-grid.component';
import { TileGroupComponent } from '../../../../core/src/shared/components/tile/tile-group/tile-group.component';
import { TileComponent } from '../../../../core/src/shared/components/tile/tile/tile.component';
import { CardNumberMetricComponent } from '../../../../core/src/shared/components/cards/card-number-metric/card-number-metric.component';
import { HomeShortcutsComponent } from '../../../../core/src/features/home/home/home-shortcuts/home-shortcuts.component';

@Component({
  selector: 'app-k8s-home-card',
  templateUrl: './kubernetes-home-card.component.html',
  styleUrls: ['./kubernetes-home-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModule,
    TileGridComponent,
    TileGroupComponent,
    TileComponent,
    CardNumberMetricComponent,
    HomeShortcutsComponent
  ]
})
export class KubernetesHomeCardComponent implements OnInit {

  @Input() endpoint!: EndpointModel;

  pLayout: HomePageCardLayout;

  get layout(): HomePageCardLayout {
    return this.pLayout;
  }

  @Input() set layout(value: HomePageCardLayout) {
    if (value) {
      this.pLayout = value;
    }
  }

  public shortcuts!: HomeCardShortcut[];

  public podCount$!: Observable<number>;
  public nodeCount$!: Observable<number>;
  public namespaceCount$!: Observable<number>;

  private store = inject(Store<AppState>);
  private injector = inject(Injector);
  private cdr = inject(ChangeDetectorRef);

  ngOnInit() {
    const guid = this.endpoint.guid;
    this.shortcuts = [
      {
        title: 'View Nodes',
        link: ['/kubernetes', guid, 'nodes'],
        icon: 'node',
        iconFont: 'stratos-icons'
      },
      {
        title: 'View Namespaces',
        link: ['/kubernetes', guid, 'resource', 'namespace'],
        icon: 'namespace',
        iconFont: 'stratos-icons'
      }
    ];
  }

  // Card is instructed to load its view by the container, whn it is visible
  load(): Observable<boolean> {
    const guid = this.endpoint.guid;
    const podsObs = kubeEntityCatalog.pod.store.getPaginationService(guid);
    const pods$ = podsObs.entities$;
    const nodesObs = kubeEntityCatalog.node.store.getPaginationService(guid);
    const nodes$ = nodesObs.entities$;
    const namespacesObs = kubeEntityCatalog.namespace.store.getPaginationService(guid);
    const namespaces$ = namespacesObs.entities$;

    this.podCount$ = pods$.pipe(map(entities => entities.length));
    this.nodeCount$ = nodes$.pipe(map(entities => entities.length));
    this.namespaceCount$ = namespaces$.pipe(map(entities => entities.length));
    this.cdr.markForCheck();

    KubernetesEndpointService.hasKubeTerminalEnabled(this.store).pipe(take(1)).subscribe(hasKubeTerminal => {
      if (hasKubeTerminal) {
        this.shortcuts.push(
          {
            title: 'Open Terminal',
            link: ['/kubernetes', guid, 'terminal'],
            icon: 'terminal',
            iconFont: 'stratos-icons'
          }
        );
      }
    });

    KubernetesEndpointService.kubeDashboardConfigured(this.store, guid).pipe(take(1)).subscribe(hasKubeDashboard => {
      if (hasKubeDashboard) {
        this.shortcuts.push(
          {
            title: 'View Dashboard',
            link: ['/kubernetes', guid, 'dashboard'],
            icon: 'dashboard'
          }
        );
      }
    });

    // Convert counts to signals within injection context
    return runInInjectionContext(this.injector, () => {
      const podCountSignal = toSignal(this.podCount$, { initialValue: 0 });
      const nodeCountSignal = toSignal(this.nodeCount$, { initialValue: 0 });
      const namespaceCountSignal = toSignal(this.namespaceCount$, { initialValue: 0 });

      // Compute loaded state - true when all counts are available
      const loadedComputed = computed(() => {
        // Access all signals to create dependency
        podCountSignal();
        nodeCountSignal();
        namespaceCountSignal();
        return true;
      });

      return toObservable(loadedComputed);
    });
  }
}
