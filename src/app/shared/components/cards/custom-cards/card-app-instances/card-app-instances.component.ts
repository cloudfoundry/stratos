import { ApplicationService } from '../../../../../features/applications/application.service';
import { Component, OnInit, OnDestroy, Input, ElementRef, ViewChild, Renderer,
  ViewChildren, QueryList, ContentChildren} from '@angular/core';
import { Subscription } from 'rxjs/Subscription';

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

  constructor(private applicationService: ApplicationService, private renderer: Renderer ) { }

  private currentCount: 0;
  private editCount: 0;

  private sub: Subscription;

  private isEditing = false;

  private editValue: any;



  ngOnInit() {
    console.log('=== BUSY =====');
    console.log(this.busy);
    this.sub = this.applicationService.application$.subscribe(app => {
      if (app.app.entity) {
        this.currentCount = app.app.entity.instances;
      }
    });

  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  scaleUp(current: number) {
    console.log('Scale Up');
    console.log(this.currentCount);
    this.applicationService.updateApplication({
      instances: this.currentCount + 1
    });
  }

  scaleDown(current: number) {
    console.log('Scale Down');
    console.log(this.currentCount);
    this.applicationService.updateApplication({
      instances: this.currentCount - 1
    });
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
      this.applicationService.updateApplication({
        instances: parseInt(this.editValue, 10)
      });
    }
  }

}
