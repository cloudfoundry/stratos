import { Component, OnInit, Input, Output } from '@angular/core';
import { EntityMonitorFactory } from '../../monitors/entity-monitor.factory.service';
import { rootUpdatingKey, RequestInfoState, ActionState } from '../../../store/reducers/api-request-reducer/types';
import { schema } from 'normalizr';
import { EntityMonitor } from '../../monitors/entity-monitor';
import { Observable } from 'rxjs';
import { map, pairwise, distinctUntilChanged, startWith, withLatestFrom, tap } from 'rxjs/operators';

export enum AppMonitorComponentTypes {
  UPDATE = 'MONITOR_UPDATE',
  DELETE = 'MONITOR_DELETE',
  CREATE = 'MONITOR_CREATE',
  FETCHING = 'MONITOR_FETCHING',
}

export interface IApplicationMonitorComponentState {
  busy: boolean;
  error: boolean;
  completed: boolean;
}

@Component({
  selector: 'app-action-monitor-icon',
  templateUrl: './app-action-monitor-icon.component.html',
  styleUrls: ['./app-action-monitor-icon.component.scss']
})
export class AppActionMonitorIconComponent implements OnInit {

  @Input()
  public entityKey: string;

  @Input()
  public id: string;

  @Input()
  public schema: schema.Entity;

  @Input()
  public monitorState: AppMonitorComponentTypes = AppMonitorComponentTypes.FETCHING;

  @Input()
  public updateKey = rootUpdatingKey;

  @Output()
  public currentState: Observable<IApplicationMonitorComponentState>;

  constructor(private entityMonitorFactory: EntityMonitorFactory) { }

  ngOnInit() {
    const entityMonitor = this.entityMonitorFactory.create(this.id, this.entityKey, this.schema);
    this.currentState = this.getStateObservable(entityMonitor, this.monitorState);
  }

  private getStateObservable(entityMonitor: EntityMonitor, monitorState: AppMonitorComponentTypes) {
    switch (monitorState) {
      case AppMonitorComponentTypes.DELETE:
        return this.getDeletingState(entityMonitor);
      case AppMonitorComponentTypes.UPDATE:
        return this.getUpdatingState(entityMonitor);
      case AppMonitorComponentTypes.FETCHING:
        return this.getFetchingState(entityMonitor);
      default:
        throw new Error(`Unknown state to monitor ${monitorState}`);
    }
  }

  private getDeletingState(entityMonitor: EntityMonitor): Observable<IApplicationMonitorComponentState> {
    return entityMonitor.entityRequest$.pipe(
      map(requestState => ({
        busy: requestState.deleting.busy,
        error: requestState.deleting.error,
        completed: requestState.deleting.deleted
      }))
    );
  }

  private getFetchingState(entityMonitor: EntityMonitor): Observable<IApplicationMonitorComponentState> {
    const completed$ = this.getHasCompletedObservable(
      entityMonitor.entityRequest$.pipe(
        map(requestState => requestState.fetching),
      )
    );
    return entityMonitor.entityRequest$.pipe(
      withLatestFrom(completed$),
      map(([requestState, completed]) => {
        const oldUpdatingState = requestState.fetching;
        const updatingState = requestState.updating[this.updateKey];
        return {
          busy: requestState.fetching,
          error: requestState.error,
          completed
        };
      })
    );
  }

  private fetchUpdatingState = (requestState: RequestInfoState): ActionState =>
    (requestState.updating[this.updateKey] || { busy: false, error: false, message: '' })
  private getUpdatingState(entityMonitor: EntityMonitor): Observable<IApplicationMonitorComponentState> {


    const completed$ = this.getHasCompletedObservable(
      entityMonitor.entityRequest$.pipe(
        map(requestState => this.fetchUpdatingState(requestState).busy),
      )
    );
    return entityMonitor.entityRequest$.pipe(
      pairwise(),
      withLatestFrom(completed$),
      map(([[oldRequestState, requestState], completed]) => {
        const oldUpdatingState = this.fetchUpdatingState(requestState);
        const updatingState = this.fetchUpdatingState(requestState);
        return {
          busy: updatingState.busy,
          error: updatingState.error,
          completed
        };
      })
    );
  }

  private getHasCompletedObservable(busy$: Observable<boolean>) {
    return busy$.pipe(
      distinctUntilChanged(),
      pairwise(),
      map(([oldBusy, newBusy]) => oldBusy && !newBusy),
      startWith(false)
    );
  }
}
