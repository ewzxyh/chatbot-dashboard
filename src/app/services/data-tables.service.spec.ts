import { of } from 'rxjs';
import { DataTablesService } from './data-tables.service';

describe('DataTablesService', () => {
  let httpClient: jasmine.SpyObj<any>;
  let service: DataTablesService;

  beforeEach(() => {
    httpClient = jasmine.createSpyObj('HttpClient', ['get', 'post', 'put', 'delete']);
    httpClient.get.and.returnValue(of([]));

    service = new DataTablesService(
      httpClient,
      {
        user_bs: of({ token: 'test-token' }),
        project_bs: of({ _id: 'project-123' }),
      } as any,
      { getConfig: () => ({ SERVER_BASE_URL: 'https://api.chatcase.test/' }) } as any,
      jasmine.createSpyObj('LoggerService', ['log', 'error']),
    );
  });

  it('lists tables using the current project and authentication token', () => {
    service.listTables().subscribe();

    expect(httpClient.get).toHaveBeenCalledWith(
      'https://api.chatcase.test/project-123/tables',
      jasmine.objectContaining({
        headers: jasmine.objectContaining({}),
      }),
    );
    const options = httpClient.get.calls.mostRecent().args[1];
    expect(options.headers.get('Authorization')).toBe('test-token');
  });
});
