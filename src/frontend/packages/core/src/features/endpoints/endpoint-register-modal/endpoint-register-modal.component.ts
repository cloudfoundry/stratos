import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ComponentRef, HostListener, Injector, OnDestroy, OnInit, Type, ViewChild, ViewContainerRef, computed, inject, signal, output } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { ActivatedRoute, ActivatedRouteSnapshot, Params } from '@angular/router';
import { of } from 'rxjs';
import {
  EndpointsDataService,
  entityCatalog,
} from '@stratosui/store';

import { SessionSignalService } from '../../../core/signals/session-signal.service';
import { ITileConfig } from '../../../shared/components/tile/tile-selector.types';
import {
  BaseEndpointTileManager,
  ICreateEndpointTilesData,
  isCreateEndpointTile,
} from '../create-endpoint/create-endpoint-base-step/base-endpoint-tile-manager';
import { TileSelectorComponent } from '../../../shared/components/tile-selector/tile-selector.component';
import { ENDPOINT_REGISTER_HANDLE, EndpointRegisterHandle } from './endpoint-register-handle';

@Component({
  selector: 'app-endpoint-register-modal',
  templateUrl: './endpoint-register-modal.component.html',
  styleUrls: ['./endpoint-register-modal.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    TileSelectorComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EndpointRegisterModalComponent extends BaseEndpointTileManager implements OnInit, OnDestroy {
  // Note: `injector` field name shadows the protected one in
  // BaseEndpointTileManager — keep the same access level (protected)
  // so TS doesn't flag the shadowed field as an incompatible base.
  protected override injector = inject(Injector);

  readonly closeModalEvent = output<void>();
  // The hosted form registered an endpoint and is done; the page refreshes,
  // says so and closes the dialog.
  readonly endpointRegistered = output<any>();

  @ViewChild('endpointFormContainer', { read: ViewContainerRef, static: false })
  // strict: ViewChild populated by Angular before loadEndpointRegistrationComponent runs.
  endpointFormContainer!: ViewContainerRef;

  readonly selectedEndpointInfo = signal<ITileConfig<ICreateEndpointTilesData> | null>(null);
  componentRef: ComponentRef<any> | null = null;

  private cdr = inject(ChangeDetectorRef);

  constructor() {
    const session = inject(SessionSignalService);

    // Tech-preview flag is sourced from the signal-native session projection;
    // bridged to Observable<StratosCatalogEndpointEntity[]> for the legacy
    // BaseEndpointTileManager constructor signature.
    const types = toObservable(
      computed(() => entityCatalog.getAllEndpointTypes(session.isTechPreview()))
    );
    super(types, inject(EndpointsDataService), inject(Injector));
  }

  ngOnInit() {
    // BaseEndpointTileManager will handle setting up the tile selector config
  }

  ngOnDestroy() {
    if (this.componentRef) {
      this.componentRef.destroy();
    }
  }

  // Close the modal on Escape.
  @HostListener('document:keydown.escape')
  public onEscape() {
    this.closeModal();
  }

  // The tile selector emits the base ITileConfig shape (or null on deselect);
  // narrow before storing/loading the typed create-endpoint tile.
  onTileSelected(tile: ITileConfig | null) {
    if (isCreateEndpointTile(tile)) {
      this.selectedEndpointInfo.set(tile);
      // Render the @if(selectedEndpointInfo()) branch synchronously so the
      // #endpointFormContainer ViewChild is available, then load the
      // registration component in the same task (no empty-form blink).
      this.cdr.detectChanges();
      this.loadEndpointRegistrationComponent(tile);
    }
  }

  private loadEndpointRegistrationComponent(tile: ITileConfig<ICreateEndpointTilesData>) {
    if (!this.endpointFormContainer) {
      console.error('endpointFormContainer not available');
      return;
    }
    if (!tile.data) {
      return;
    }

    // Clear previous component
    this.endpointFormContainer.clear();
    if (this.componentRef) {
      this.componentRef.destroy();
    }

    const epType = tile.data.parentType || tile.data.type;
    const epSubType = tile.data.parentType ? tile.data.type : '';
    const registrationComponent = entityCatalog.getEndpoint(epType, epSubType)?.definition.registrationComponent;

    if (registrationComponent) {
      try {
        this.createRegistrationComponent(registrationComponent, epType, epSubType);
        return;
      } catch (error) {
        console.error('Error creating endpoint registration component:', error);
      }
    }
    // Types without their own registration component (or whose component
    // failed) use the generic create-endpoint form.
    import('../create-endpoint/create-endpoint.component')
      .then(module => this.createRegistrationComponent(module.CreateEndpointComponent, epType, epSubType))
      .catch(error => console.error('Error loading create-endpoint component:', error));
  }

  // The registration components read their endpoint type from the route, as
  // on the /endpoints/new pages; inside the dialog they get a stand-in route,
  // and the handle they close the dialog with.
  private createRegistrationComponent(component: Type<any>, epType: string, epSubType: string) {
    const params: Params = {
      type: epType,
      subtype: epSubType
    };
    const queryParams = {};
    const route = {
      snapshot: {
        params,
        paramMap: {
          get: (key: string) => params[key]
        },
        queryParams
      } as ActivatedRouteSnapshot,
      params: of(params),
      paramMap: of({
        get: (key: string) => params[key]
      }),
      queryParams: of(queryParams)
    } as unknown as ActivatedRoute;
    const handle: EndpointRegisterHandle = {
      close: registered => registered ? this.endpointRegistered.emit() : this.closeModal(),
    };

    const injector = Injector.create({
      providers: [
        { provide: ActivatedRoute, useValue: route },
        { provide: ENDPOINT_REGISTER_HANDLE, useValue: handle },
      ],
      parent: this.injector
    });

    this.componentRef = this.endpointFormContainer.createComponent(component, { index: 0, injector });
    // Suppress any nested <app-page-header> — we're inside the modal which
    // has its own header. Two nested page-headers clobber the TabNavService
    // pageHeader signal on modal close. Safe no-op if the component doesn't
    // declare a hideHeader input.
    (this.componentRef.instance as any).hideHeader = true;
  }

  goBackToSelection() {
    this.selectedEndpointInfo.set(null);

    // Clear the form component
    if (this.endpointFormContainer) {
      this.endpointFormContainer.clear();
    }
    if (this.componentRef) {
      this.componentRef.destroy();
      this.componentRef = null;
    }
  }

  closeModal() {
    this.closeModalEvent.emit();
  }
}
