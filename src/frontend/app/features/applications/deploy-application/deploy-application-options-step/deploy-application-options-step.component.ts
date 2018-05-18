import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ErrorStateMatcher, ShowOnDirtyErrorStateMatcher } from '@angular/material';

@Component({
  selector: 'app-deploy-application-options-step',
  templateUrl: './deploy-application-options-step.component.html',
  styleUrls: ['./deploy-application-options-step.component.scss'],
  providers: [
    { provide: ErrorStateMatcher, useClass: ShowOnDirtyErrorStateMatcher }
  ]
})
export class DeployApplicationOptionsStepComponent implements OnInit {

  deployOptionsForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.deployOptionsForm = this.fb.group({
      name: '',
      instances: [0, [
        Validators.required,
        Validators.min(0)
      ]],
      disk_quota: [0, [
        Validators.required,
        Validators.min(0)
      ]],
      memory: [0, [
        Validators.required,
        Validators.min(0)
      ]],
      host: '',
      domain: '',
      buildpack: '',
      no_route: false,
      random_route: false,
      no_start: false
    });
  }

  ngOnInit() { }

}
