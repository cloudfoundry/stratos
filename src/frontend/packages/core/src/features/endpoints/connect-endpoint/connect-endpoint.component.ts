import {
  Component,
  ComponentFactoryResolver,
  ComponentRef,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  Type,
  ViewChild,
  ViewContainerRef,
} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';

import { entityCatalog } from '../../../../../store/src/entity-catalog/entity-catalog';
import { EndpointAuthTypeConfig, IAuthForm, IEndpointAuthComponent } from '../../../../../store/src/extension-types';
import { BaseEndpointAuth } from '../../../core/endpoint-auth';
import { safeUnsubscribe } from '../../../core/utils.service';
import { ConnectEndpointConfig, ConnectEndpointData, ConnectEndpointService } from '../connect.service';

@Component({
  selector: 'app-connect-endpoint',
  templateUrl: './connect-endpoint.component.html',
  styleUrls: ['./connect-endpoint.component.scss']
})
export class ConnectEndpointComponent implements OnInit, OnDestroy {
  private pDisabled = false;
  private pConnectService: ConnectEndpointService;
  @Input() set connectService(service: ConnectEndpointService) {
    if (!service || this.pConnectService) {
      return;
    }
    this.pConnectService = service;
    this.init(service.config);
  }
  get connectService(): ConnectEndpointService {
    return this.pConnectService;
  }

  @Input() set disabled(disabled: boolean) {
    if (this.endpointForm) {
      disabled ? this.endpointForm.disable() : this.endpointForm.enable();
    }
    this.pDisabled = disabled;
  }

  /**
   * Make the form submit as if it had a button - aka on pressing return
   */
  @Input() formSubmit = false;

  @Output() valid = new EventEmitter<boolean>();
  @Output() authType = new EventEmitter<EndpointAuthTypeConfig>();

  // Component reference for the dynamically created auth form
  @ViewChild('authForm', { read: ViewContainerRef, static: true })
  public container: ViewContainerRef;

  public endpointForm: FormGroup;

  private bodyContent = '';

  public authTypesForEndpoint: EndpointAuthTypeConfig[] = [];
  public canShareEndpointToken = false;
  private cachedAuthTypeFormFields: string[] = [];

  // The auth type that was initially auto-selected
  private autoSelected: EndpointAuthTypeConfig;
  private authFormComponentRef: ComponentRef<IAuthForm>;

  private subs: Subscription[] = [];

  constructor(
    private fb: FormBuilder,
    private resolver: ComponentFactoryResolver,

  ) { }

  private init(config: ConnectEndpointConfig) {
    const endpoint = entityCatalog.getEndpoint(config.type, config.subType);
    // Populate the valid auth types for the endpoint that we want to connect to

    // Remove SSO if not allowed on this endpoint
    if (config.ssoAllowed) {
      this.authTypesForEndpoint = endpoint.definition.authTypes;
    } else {
      this.authTypesForEndpoint = endpoint.definition.authTypes.filter(authType => authType.value !== BaseEndpointAuth.SSO.value);
    }


    // Not all endpoint types might allow token sharing - typically types like metrics do
    this.canShareEndpointToken = endpoint.definition.tokenSharing;

    // Create the endpoint form
    this.autoSelected = (this.authTypesForEndpoint.length > 0) ? this.authTypesForEndpoint[0] : { form: null } as EndpointAuthTypeConfig;

    // Auto-select SSO if it is available
    const ssoIndex = this.authTypesForEndpoint.findIndex(authType => authType.value === 'sso' && config.ssoAllowed);
    if (ssoIndex >= 0) {
      this.autoSelected = this.authTypesForEndpoint[ssoIndex];
    }

    this.cachedAuthTypeFormFields = Object.keys(this.autoSelected.form || {});
    this.endpointForm = this.fb.group({
      authType: [this.autoSelected.value || '', Validators.required],
      authValues: this.fb.group(this.autoSelected.form || {}),
      systemShared: false
    });
    this.authChanged();

    // Template container reference is not available at construction
    this.createComponent(this.autoSelected.component);

    this.subs.push(this.endpointForm.valueChanges.pipe().subscribe(res => {
      const authType = this.authTypesForEndpoint.find(ep => ep.value === res.authType);
      let valid = false;
      if (authType.component === this.authFormComponentRef.componentType) {
        this.setData();
        valid = this.endpointForm.valid;
      }
      this.valid.next(valid);
    }));

    // Set initial valid status
    this.endpointForm.updateValueAndValidity();
  }

  ngOnInit() {
    if (!this.endpointForm) {
      // Ensure there's something for the html to bind to
      this.endpointForm = this.fb.group({
        authType: null,
        systemShared: false
      });
    }
  }

  authChanged() {
    const authType = this.authTypesForEndpoint.find(ep => ep.value === this.endpointForm.value.authType);
    const authTypeFormFields = Object.keys(authType.form);
    if (!this.sameAuthTypeFormFields(this.cachedAuthTypeFormFields, authTypeFormFields)) {
      // Don't remove and re-add the same control, this helps with form validation
      this.cachedAuthTypeFormFields = authTypeFormFields;
      this.endpointForm.removeControl('authValues');
      this.endpointForm.addControl('authValues', this.fb.group(authType.form));

      // Update the auth form component
      this.createComponent(authType.component);
    }
    this.bodyContent = '';
    this.authType.next(authType);
  }

  // Dynamically create the component for the selected auth type
  createComponent(component: Type<IAuthForm>) {
    if (!component || !this.container) {
      return;
    }

    if (this.authFormComponentRef) {
      this.authFormComponentRef.destroy();
    }

    const factory = this.resolver.resolveComponentFactory<IAuthForm>(component);
    this.authFormComponentRef = this.container.createComponent<IAuthForm>(factory);
    this.authFormComponentRef.instance.formGroup = this.endpointForm;
    this.pDisabled ? this.endpointForm.disable() : this.endpointForm.enable();
  }

  private sameAuthTypeFormFields(a: string[], b: string[]): boolean {
    return a.length === b.length && a.filter(item => b.indexOf(item) < 0).length === 0;
  }

  private getData(): ConnectEndpointData {
    const { authType, authValues, systemShared } = this.endpointForm.value;
    let authVal = authValues;

    // Allow the auth form to supply body content if it needs to
    const endpointFormInstance = this.authFormComponentRef.instance as IEndpointAuthComponent;
    if (endpointFormInstance.getBody && endpointFormInstance.getValues) {
      this.bodyContent = endpointFormInstance.getBody();
      authVal = endpointFormInstance.getValues(authValues);
    }

    return {
      authType,
      authVal,
      systemShared,
      bodyContent: this.bodyContent,
    };
  }

  setData() {
    if (this.connectService) {
      // Push data into service such that it's ready to go on submit. This removes a lot of plumbing of data outside of component to parent
      // and then back in to service
      this.connectService.setData(this.getData());
    }
  }

  ngOnDestroy() {
    safeUnsubscribe(...this.subs);
    if (this.authFormComponentRef) {
      this.authFormComponentRef.destroy();
    }
  }
}

