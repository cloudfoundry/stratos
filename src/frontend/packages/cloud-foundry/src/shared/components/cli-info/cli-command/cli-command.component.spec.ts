import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CoreModule } from '../../../../../../core/src/core/core.module';
import { MDAppModule } from '../../../../../../core/src/core/md.module';
import { CodeBlockComponent } from '../../../../../../core/src/shared/components/code-block/code-block.component';
import { generateCfStoreModules } from '../../../../../../core/test-framework/cloud-foundry-endpoint-service.helper';
import { CliCommandComponent } from './cli-command.component';

describe('CliCommandComponent', () => {
  let component: CliCommandComponent;
  let fixture: ComponentFixture<CliCommandComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CliCommandComponent, CodeBlockComponent],
      imports: [
        MDAppModule,
        CoreModule,
        generateCfStoreModules(),
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CliCommandComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
