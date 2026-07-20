import { of } from 'rxjs';
import { DataTablesService } from './data-tables.service';

describe('DataTablesService', () => {
  let httpClient: jasmine.SpyObj<any>;
  let service: DataTablesService;

  beforeEach(() => {
    httpClient = jasmine.createSpyObj('HttpClient', ['get', 'post', 'put', 'patch', 'delete']);
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

  it('uses the server row contract when inserting a row', () => {
    httpClient.post.and.returnValue(of({ _id: 'row-1', data: { name: 'Ana' } }));

    service.insertRow('table-1', { data: { name: 'Ana' } }).subscribe();

    expect(httpClient.post).toHaveBeenCalledWith(
      'https://api.chatcase.test/project-123/tables/table-1/row/insert',
      { data: { name: 'Ana' } },
      jasmine.any(Object),
    );
  });

  it('uses the column id contract when renaming and deleting a column', () => {
    httpClient.patch.and.returnValue(of({}));
    httpClient.delete.and.returnValue(of({}));

    service.renameColumn('table-1', 'column-1', { name: 'renamed' }).subscribe();
    service.deleteColumn('table-1', 'column-1').subscribe();

    expect(httpClient.patch).toHaveBeenCalledWith(
      'https://api.chatcase.test/project-123/tables/table-1/columns/column-1',
      { name: 'renamed' },
      jasmine.any(Object),
    );
    expect(httpClient.delete).toHaveBeenCalledWith(
      'https://api.chatcase.test/project-123/tables/table-1/columns/column-1',
      jasmine.any(Object),
    );
  });
});
