import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KnowledgeBasesComponent } from './knowledge-bases.component';

describe('KnowledgeBasesComponent', () => {
  let component: KnowledgeBasesComponent;
  let fixture: ComponentFixture<KnowledgeBasesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [KnowledgeBasesComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(KnowledgeBasesComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('preserves question deep-link params when selecting a namespace', () => {
    const navigate = jasmine.createSpy('navigate');
    const queryParams = new Map<string, string>([
      ['tab', 'questions'],
      ['questionsSub', 'unanswered'],
    ]);
    const component = Object.assign(Object.create(KnowledgeBasesComponent.prototype), {
      logger: { log: () => undefined },
      project: { _id: 'project-1' },
      router: { navigate },
      route: { snapshot: { queryParamMap: { get: (key: string) => queryParams.get(key) ?? null } } },
      getChatbotUsingNamespace: () => undefined,
      localDbService: { setInStorage: () => undefined },
      getListOfKb: () => undefined,
      id_project: 'project-1',
      selectedTab: 'contents',
    }) as KnowledgeBasesComponent;

    component.onSelectNamespace({
      id: 'namespace-1',
      name: 'Support',
      count: 3,
    });

    expect(navigate).toHaveBeenCalledWith(
      ['project/project-1/knowledge-bases/namespace-1'],
      { queryParams: { tab: 'questions', questionsSub: 'unanswered' } }
    );
  });

  it('retries the last content request through the loading state', () => {
    const getListOfKb = jasmine.createSpy('getListOfKb');
    const component = Object.assign(Object.create(KnowledgeBasesComponent.prototype), {
      getListOfKb,
      lastKbListRequestParams: '?namespace=namespace-1&page=2',
      showKBTableSpinner: false,
    }) as KnowledgeBasesComponent;

    component.retryKbList();

    expect(component.showKBTableSpinner).toBe(true);
    expect(getListOfKb).toHaveBeenCalledWith('?namespace=namespace-1&page=2', 'retry');
  });
});
