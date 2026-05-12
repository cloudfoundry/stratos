import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ComponentRef, EventEmitter, HostListener, Injector, OnDestroy, OnInit, Output, ViewChild, ViewContainerRef, computed, inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { ActivatedRoute, ActivatedRouteSnapshot, Params } from '@angular/router';
import { of } from 'rxjs';
import {
  GeneralEntityAppState,
  Store,
  entityCatalog,
} from '@stratosui/store';

import { SessionSignalService } from '../../../core/signals/session-signal.service';
import { ITileConfig } from '../../../shared/components/tile/tile-selector.types';
import { BaseEndpointTileManager, ICreateEndpointTilesData } from '../create-endpoint/create-endpoint-base-step/base-endpoint-tile-manager';
import { TileSelectorComponent } from '../../../shared/components/tile-selector/tile-selector.component';

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
  protected store: Store<GeneralEntityAppState>;
  private injector = inject(Injector);

  @Output() closeModalEvent = new EventEmitter<void>();
  @Output() endpointRegistered = new EventEmitter<any>();

  @ViewChild('endpointFormContainer', { read: ViewContainerRef, static: false }) 
  endpointFormContainer: ViewContainerRef;

  selectedEndpointInfo: ITileConfig<ICreateEndpointTilesData> | null = null;
  componentRef: ComponentRef<any>;

  private cdr = inject(ChangeDetectorRef);

  constructor() {
    const store = inject<Store<GeneralEntityAppState>>(Store);
    const session = inject(SessionSignalService);

    // Tech-preview flag is sourced from the signal-native session projection;
    // bridged to Observable<StratosCatalogEndpointEntity[]> for the legacy
    // BaseEndpointTileManager constructor signature.
    const types = toObservable(
      computed(() => entityCatalog.getAllEndpointTypes(session.isTechPreview()))
    );
    super(types, store);
    this.store = store;
  }

  ngOnInit() {
    // BaseEndpointTileManager will handle setting up the tile selector config
  }

  ngOnDestroy() {
    if (this.componentRef) {
      this.componentRef.destroy();
    }
  }

  // Close the modal on Escape. Using HostListener (not raw addEventListener)
  // keeps the event inside Angular's handler pipeline so change detection
  // fires under zoneless mode — needed so the parent's *appUserPermission
  // directive re-evaluates after showRegisterModal flips to false.
  @HostListener('document:keydown.escape')
  public onEscape() {
    this.closeModal();
  }

  onTileSelected(tile: ITileConfig<ICreateEndpointTilesData>) {
    if (tile) {
      this.selectedEndpointInfo = tile;
      // Force the @if(selectedEndpointInfo) branch to render synchronously
      // so the #endpointFormContainer ViewChild is available — then load
      // the registration component in the same task. The previous code
      // used setTimeout(..., 100) which left an empty form container
      // visible for ~100ms, producing a visible blink between tile
      // selection and the loaded form.
      this.cdr.detectChanges();
      this.loadEndpointRegistrationComponent(tile);
    }
  }

  private loadEndpointRegistrationComponent(tile: ITileConfig<ICreateEndpointTilesData>) {
    if (!this.endpointFormContainer) {
      console.error('endpointFormContainer not available');
      return;
    }

    // Clear previous component
    this.endpointFormContainer.clear();
    if (this.componentRef) {
      this.componentRef.destroy();
    }

    const epType = tile.data.parentType || tile.data.type;
    const epSubType = tile.data.parentType ? tile.data.type : '';
    
    console.log('Loading endpoint registration for:', { epType, epSubType });

    // Get the endpoint definition
    const endpoint = entityCatalog.getEndpoint(epType, epSubType);
    console.log('Found endpoint definition:', endpoint);

    if (endpoint && endpoint.definition.registrationComponent) {
      try {
        // Create mock route parameters like the original create-endpoint component
        const mockParams: Params = {
          type: epType,
          subtype: epSubType
        };

        const mockQueryParams = {}; // Add any needed query params here

        const mockActivatedRoute = {
          snapshot: {
            params: mockParams,
            paramMap: {
              get: (key: string) => mockParams[key]
            },
            queryParams: mockQueryParams
          } as ActivatedRouteSnapshot,
          params: of(mockParams),
          paramMap: of({
            get: (key: string) => mockParams[key]
          }),
          queryParams: of(mockQueryParams)
        } as unknown as ActivatedRoute;

        // Create a custom injector that provides the mock ActivatedRoute
        const componentInjector = Injector.create({
          providers: [
            { provide: ActivatedRoute, useValue: mockActivatedRoute }
          ],
          parent: this.injector
        });

        // Create the component with the custom injector
        this.componentRef = this.endpointFormContainer.createComponent(
          endpoint.definition.registrationComponent, { index: 0, injector: componentInjector }
        );
        // Suppress any nested <app-page-header> — we're inside the modal which
        // has its own header. Two nested page-headers clobber the TabNavService
        // pageHeader signal on modal close. Safe no-op if the component doesn't
        // declare a hideHeader input.
        (this.componentRef.instance as any).hideHeader = true;

        console.log('Registration component created successfully:', this.componentRef);

        // Hook into the component's registration success
        this.hookIntoComponentSuccess();

      } catch (error) {
        console.error('Error creating endpoint registration component:', error);
        
        // Fallback: try to load the create-endpoint component
        this.loadCreateEndpointComponent(epType, epSubType);
      }
    } else {
      // Fallback: load the create-endpoint component for endpoints without custom registration
      console.log('No custom registration component, loading create-endpoint component');
      this.loadCreateEndpointComponent(epType, epSubType);
    }
  }

  private loadCreateEndpointComponent(epType: string, epSubType: string) {
    try {
      // Import and load the create-endpoint component
      import('../create-endpoint/create-endpoint.component').then(module => {
        // Create mock route parameters
        const mockParams: Params = {
          type: epType,
          subtype: epSubType
        };

        const mockQueryParams = {}; // Add any needed query params here

        const mockActivatedRoute = {
          snapshot: {
            params: mockParams,
            paramMap: {
              get: (key: string) => mockParams[key]
            },
            queryParams: mockQueryParams
          } as ActivatedRouteSnapshot,
          params: of(mockParams),
          paramMap: of({
            get: (key: string) => mockParams[key]
          }),
          queryParams: of(mockQueryParams)
        } as unknown as ActivatedRoute;

        const componentInjector = Injector.create({
          providers: [
            { provide: ActivatedRoute, useValue: mockActivatedRoute }
          ],
          parent: this.injector
        });

        this.componentRef = this.endpointFormContainer.createComponent(
          module.CreateEndpointComponent, { index: 0, injector: componentInjector }
        );
        // Hide the inner <app-page-header> — we're inside the modal which
        // has its own header. Without this the nested header clobbers the
        // outer endpoints-page header via TabNavService.
        (this.componentRef.instance as any).hideHeader = true;
        console.log('Create-endpoint component loaded:', this.componentRef);
        
        this.hookIntoComponentSuccess();
      });
    } catch (error) {
      console.error('Error loading create-endpoint component:', error);
    }
  }

  private hookIntoComponentSuccess() {
    // Try to hook into various success patterns
    if (this.componentRef?.instance) {
      const instance = this.componentRef.instance;
      
      // Check for onNext method (stepper pattern)
      if (instance.onNext) {
        const originalOnNext = instance.onNext.bind(instance);
        instance.onNext = () => {
          const result = originalOnNext();
          this.handleRegistrationResult(result);
          return result;
        };
      }

      // Check for success events
      if (instance.success && typeof instance.success.subscribe === 'function') {
        instance.success.subscribe(() => {
          this.onEndpointRegistered();
        });
      }
      
      // Check for registration complete events
      if (instance.registrationComplete && typeof instance.registrationComplete.subscribe === 'function') {
        instance.registrationComplete.subscribe(() => {
          this.onEndpointRegistered();
        });
      }
    }
  }

  private handleRegistrationResult(result: any) {
    if (result && typeof result.subscribe === 'function') {
      // Handle observable result
      result.subscribe((response: any) => {
        console.log('Registration response:', response);
        if (response && response.success) {
          this.onEndpointRegistered();
        }
      });
    } else if (result && typeof result.then === 'function') {
      // Handle promise result
      result.then((success: boolean) => {
        console.log('Registration result:', success);
        if (success) {
          this.onEndpointRegistered();
        }
      });
    }
  }

  goBackToSelection() {
    this.selectedEndpointInfo = null;
    
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

  private onEndpointRegistered() {
    console.log('Modal: onEndpointRegistered called - emitting event');
    this.endpointRegistered.emit();
    // Small delay to show success before closing
    setTimeout(() => {
      this.closeModal();
    }, 1000);
  }
}