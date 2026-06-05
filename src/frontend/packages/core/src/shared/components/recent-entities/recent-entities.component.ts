import { Component, Input, effect, inject, ChangeDetectionStrategy } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CustomIconComponent } from '../custom-material/custom-material.component';
import {
  endpointEntityType,
  RecentlyVisitedDataService,
  IRecentlyVisitedEntity,
  entityCatalog,
  MAX_RECENT_COUNT,
} from '@stratosui/store';
import { Observable, of as observableOf } from 'rxjs';
import { map } from 'rxjs/operators';

import { EndpointsSignalService } from '../../../core/signals/endpoints-signal.service';
import { FreshEntityNameService } from '../../../core/signals/fresh-entity-name.service';
import { NoContentMessageComponent } from '../no-content-message/no-content-message.component';

class RenderableRecent {
  public mostRecentHit?: Date;
  public subText$: Observable<string>;
  public icon: string;
  public iconFont: string;
  constructor(
    readonly entity: IRecentlyVisitedEntity,
    endpointEntities$: Observable<Record<string, { name?: string }>>,
  ) {
    const catalogEntity = entityCatalog.getEntity(entity.endpointType, entity.entityType);
    this.icon = catalogEntity.definition.icon;
    this.iconFont = catalogEntity.definition.iconFont;
    if (!entity.endpointId) {
      console.error(`Entity ${entity.guid} does not contain a value for endpointId - recent metadata is malformed`);
    }
    if (entity.entityType === endpointEntityType) {
      this.subText$ = observableOf(entity.prettyType);
    } else {
      this.subText$ = endpointEntities$.pipe(
        map(endpoints => {
          if (entity.endpointId && Object.keys(endpoints).length > 1) {
            return `${entity.prettyType} - ${endpoints[entity.endpointId].name}`;
          }
          return entity.prettyType;
        })
      );
    }
  }
}

@Component({
  selector: 'app-recent-entities',
  templateUrl: './recent-entities.component.html',
  styleUrls: ['./recent-entities.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    CustomIconComponent,
    NoContentMessageComponent
  ]
})
export class RecentEntitiesComponent {
  private recents = inject(RecentlyVisitedDataService);
  private endpointsSignals = inject(EndpointsSignalService);
  private freshNames = inject(FreshEntityNameService);

  // Names already written back, keyed by recent guid — prevents the
  // write-back effect from re-emitting the same correction.
  private lastPersisted = new Map<string, string>();

  @Input()
  public history = false;

  @Input() mode?: string;

  public recentEntities$: Observable<RenderableRecent[]>;
  public hasHits$: Observable<boolean>;

  // Bridge endpoints signal → observable in injection context. Captured
  // once and reused for every RenderableRecent so we don't re-bind per row.
  private endpointEntities$ = toObservable(this.endpointsSignals.endpoints);

  constructor() {
    const recentEntities$ = this.recents.state$;
    this.recentEntities$ = recentEntities$.pipe(
      map(entities => Object.values(entities)),
      map((entities: IRecentlyVisitedEntity[]) => {
        // Sort them - most recent first
        // Cap the list at the maximum we can display
        const sorted = entities.sort((a, b) => b.date - a.date).slice(0, MAX_RECENT_COUNT);
        return sorted.map(entity => new RenderableRecent(entity, this.endpointEntities$));
      })
    );

    this.hasHits$ = this.recentEntities$.pipe(
      map(recentEntities => recentEntities && recentEntities.length > 0)
    );

    // Signal-native name refresh (replaces the deleted ngrx requestData sync):
    // when a recent's freshly-fetched entity name diverges from the stored one,
    // write it back through the recents store. The update flows through state$
    // to the rendered list, so no render-path change is needed. The guard +
    // lastPersisted map make this converge after a single write per rename.
    effect(() => {
      const state = this.recents.state();
      Object.values(state).forEach((recent: IRecentlyVisitedEntity) => {
        if (!recent) {
          return;
        }
        const fresh = this.freshNames.freshNameFor(recent);
        if (fresh && fresh !== recent.name && this.lastPersisted.get(recent.guid) !== fresh) {
          this.lastPersisted.set(recent.guid, fresh);
          this.recents.set({ ...recent, name: fresh });
        }
      });
    });
  }
}

