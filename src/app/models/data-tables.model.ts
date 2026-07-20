export type ColumnType = 'string' | 'number' | 'boolean' | 'datetime';

export interface Column {
  id: string;
  name: string;
  type: ColumnType;
  index: number;
}

export interface ColumnInput {
  name: string;
  type: ColumnType;
  index?: number;
}

export interface DataTable {
  _id?: string;
  id_project?: string;
  name?: string;
  schema?: Column[];
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface TableWithRows extends DataTable {
  rows?: RowData[];
}

export interface CreateTableRequest {
  name: string;
  schema?: ColumnInput[];
}

export interface UpdateTableRequest {
  name?: string;
  schema?: Array<Column | ColumnInput>;
}

export type RowData = Record<string, unknown>;

export interface RowDocument {
  _id?: string;
  id_project?: string;
  id_table?: string;
  data?: RowData;
  createdAt?: string;
  updatedAt?: string;
}

export interface InsertRowRequest {
  data: RowData;
  id_row?: string;
}

export interface RowListItem {
  _id?: string;
  [key: string]: unknown;
}

export type ConditionOperator = 'equal' | 'not_equal' | 'greater_than'
  | 'greater_or_equal' | 'less_than' | 'less_or_equal' | 'contains';

export type MustMatch = 'all' | 'any';

export interface RowCondition {
  column: string;
  operator: ConditionOperator;
  value: string | number | boolean;
}

export interface RowMutationRequest {
  data: RowData;
  id_row?: string;
  must_match?: MustMatch;
  conditions?: RowCondition[];
}

export interface UpsertRowRequest extends RowMutationRequest {
  multi?: boolean;
}

export interface ApiSuccessMessage {
  success?: boolean;
  message?: string;
}

export interface ApiErrorResponse {
  success?: boolean;
  error?: string;
}
