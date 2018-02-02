import { getPaginationKey } from '../../../../store/actions/pagination.actions';
import { APIResource, EntityInfo } from '../../../../store/types/api.types';
import { ApplicationService } from '../../../../features/applications/application.service';
import {
  Component, OnInit, OnDestroy, Input, ElementRef, ViewChild, Renderer,
  ViewChildren, QueryList, ContentChildren
} from '@angular/core';
import { Subscription } from 'rxjs/Subscription';
import { Observable } from 'rxjs/Observable';
import { AppState } from '../../../../store/app-state';
import { Store } from '@ngrx/store';
import { map } from 'rxjs/operators';
import { selectEntity } from '../../../../store/selectors/api.selectors';
import { AppStatSchema, AppStats, AppStatsSchema } from '../../../../store/types/app-metadata.types';
import { GetAppStatsAction, AppMetadataTypes } from '../../../../store/actions/app-metadata.actions';
import { getPaginationPages } from '../../../../store/reducers/pagination-reducer/pagination-reducer.helper';
import { ConfirmationDialog, ConfirmationDialogService } from '../../confirmation-dialog.service';

const appInstanceScaleToZeroConfirmation = new ConfirmationDialog('Set Instance count to 0',
  'Are you sure you want to set the instance count to 0?', 'Confirm');

@Component({
  selector: 'app-card-app-instances',
  templateUrl: './card-app-instances.component.html',
  styleUrls: ['./card-app-instances.component.scss']
})
export class CardAppInstancesComponent implements OnInit, OnDestroy {

  // Should the card show the actions to scale/down the number of instances?
  @Input('showActions') showActions = false;

  @Input('busy') busy: any;

  @ViewChild('instanceField') instanceField: ElementRef;

  constructor(
    private store: Store<AppState>,
    public applicationService: ApplicationService,
    private renderer: Renderer,
    private confirmDialog: ConfirmationDialogService) { }

  private currentCount: 0;
  private editCount: 0;

  private sub: Subscription;

  private isEditing = false;

  private editValue: any;

  // Observable on the running instances count for the application
  private runningInstances$: Observable<number>;

  private isRunning = false;

  ngOnInit() {
    this.sub = this.applicationService.application$.subscribe(app => {
      if (app.app.entity) {
        this.currentCount = app.app.entity.instances;
        this.isRunning = app.app.entity.state === 'STARTED';
      }
    });

  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  scaleUp(current: number) {
    this.setInstanceCount(this.currentCount + 1);
  }

  scaleDown(current: number) {
    this.setInstanceCount(this.currentCount - 1);
  }

  edit() {
    this.editValue = this.currentCount;
    this.isEditing = true;
    setTimeout(() => {
      this.renderer.invokeElementMethod(this.instanceField.nativeElement, 'focus', []);
    }, 0);
  }

  finishEdit(ok: boolean) {
    this.isEditing = false;
    if (ok) {
      this.setInstanceCount(parseInt(this.editValue, 10));
    }
  }

  // Set instance count. Ask for confirmation if setting count to 0
  private setInstanceCount(value: number) {
    const doUpdate = () => this.applicationService.updateApplication({ instances: value }, [AppMetadataTypes.STATS]);
    if (value === 0) {
      this.confirmDialog.open(appInstanceScaleToZeroConfirmation, doUpdate);
    } else {
      doUpdate();
    }
  }
}
