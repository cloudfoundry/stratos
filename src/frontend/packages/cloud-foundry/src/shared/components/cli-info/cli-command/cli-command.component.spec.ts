import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CliCommandComponent } from './cli-command.component';
import { CodeBlockComponent } from '../../../../../../core/src/shared/components/code-block/code-block.component';
import { MDAppModule } from '../../../../../../core/src/core/md.module';
import { CoreModule } from '../../../../../../core/src/core/core.module';
import { createBasicStoreModule } from '../../../../../../core/test-framework/store-test-helper';

describe('CliCommandComponent', () => {
  let component: CliCommandComponent;
  let fixture: ComponentFixture<CliCommandComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CliCommandComponent, CodeBlockComponent ],
      imports: [
        MDAppModule,
        CoreModule,
        createBasicStoreModule(),
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
