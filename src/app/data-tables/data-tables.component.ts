import { Component, OnInit } from '@angular/core';
import { ConnectedPosition } from '@angular/cdk/overlay';
import { ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { AuthService } from 'app/core/auth.service';
import { NotifyService } from 'app/core/notify.service';
import { LoggerService } from 'app/services/logger/logger.service';
import { LocalDbService } from 'app/services/users-local-db.service';
import { DataTablesService } from 'app/services/data-tables.service';
import { Column, ColumnInput, DataTable, RowData, RowListItem } from 'app/models/data-tables.model';
import { CreateTableModalComponent, CreateTableModalResult } from './modals/create-table-modal.component';
import Swal from 'sweetalert2';

/** Visual column model for the table view (derived from DataTable.schema). */
interface ColumnView {
  id: string;
  name: string;
  type: string;
}

/** Editable grid row — localId for trackBy; _id after first save to API. */
interface EditableRow {
  localId: string;
  _id?: string;
  data: RowData;
  isSaving?: boolean;
  /** Prevents duplicate insertRow when blur fires on multiple cells before _id is set. */
  insertInFlight?: boolean;
}

/** UI labels for the column type select; API expects the lowercase value. */
interface ColumnTypeOption {
  label: string;
  value: string;
  disabled: boolean;
}

@Component({
  selector: 'appdashboard-data-tables',
  templateUrl: './data-tables.component.html',
  styleUrls: ['./data-tables.component.scss'],
})
export class DataTablesComponent implements OnInit {

  readonly maxTableRows = 200;
  readonly rowsPageSize = 40;
  currentRowsPage = 1;

  tables: DataTable[] = [];
  selectedTable: DataTable | null = null;
  /** Stable id for sidebar highlight — avoids reference mismatch after getTable(). */
  selectedTableId: string | null = null;
  rows: EditableRow[] = [];
  totalTableRowCount = 0;
  columnMenuTarget: ColumnView | null = null;

  isLoadingTables = false;
  isLoadingRows = false;
  deletingRowId: string | null = null;

  get isTableRowLimitReached(): boolean {
    return this.totalTableRowCount >= this.maxTableRows;
  }

  get totalRowsPages(): number {
    return Math.max(1, Math.ceil(this.rows.length / this.rowsPageSize));
  }

  get pagedRows(): EditableRow[] {
    const start = (this.currentRowsPage - 1) * this.rowsPageSize;
    return this.rows.slice(start, start + this.rowsPageSize);
  }

  get showRowsPagination(): boolean {
    return !this.isLoadingRows && this.rows.length > this.rowsPageSize;
  }

  // Add Column popover (toolbar)
  isAddColumnPopoverOpen = false;
  isSavingColumn = false;
  newColumnName = '';
  newColumnType = 'string';
  addColumnNameError = '';

  readonly columnTypes: ColumnTypeOption[] = [
    { label: 'String',  value: 'string',  disabled: false },
    { label: 'Boolean', value: 'boolean', disabled: true  },
    { label: 'Date',    value: 'date',    disabled: true  },
    { label: 'Number',  value: 'number',  disabled: true  },
  ];

  readonly addColumnPopoverPositions: ConnectedPosition[] = [
    {
      originX: 'end',
      originY: 'bottom',
      overlayX: 'end',
      overlayY: 'top',
      offsetY: 8,
    },
    {
      originX: 'start',
      originY: 'bottom',
      overlayX: 'start',
      overlayY: 'top',
      offsetY: 8,
    },
  ];

  private localIdCounter = 0;
  private id_project = '';

  constructor(
    private dialog: MatDialog,
    private dataTablesService: DataTablesService,
    private logger: LoggerService,
    private notify: NotifyService,
    private translate: TranslateService,
    private auth: AuthService,
    private route: ActivatedRoute,
    private localDbService: LocalDbService,
  ) {}

  ngOnInit(): void {
    this.id_project = this.route.snapshot.paramMap.get('projectid') || '';
    this.auth.project_bs.subscribe((project) => {
      if (project?._id) {
        this.id_project = project._id;
      }
    });
    this.loadTables();
  }

  // ─── Data loading ────────────────────────────────────────────────────────

  private loadTables(): void {
    this.isLoadingTables = true;
    this.dataTablesService.listTables().subscribe({
      next: (tables) => {
        this.tables = tables || [];
        this.isLoadingTables = false;
        this.selectInitialTable();
        this.logger.log('[DATA-TABLES] loaded tables', this.tables);
      },
      error: (err) => {
        this.isLoadingTables = false;
        this.logger.error('[DATA-TABLES] listTables error', err);
      },
    });
  }

  private loadTableRows(table: DataTable): void {
    this.currentRowsPage = 1;
    if (!table._id) {
      this.rows = this.buildRowsFromLoaded(table.schema, []);
      this.totalTableRowCount = 0;
      return;
    }

    this.isLoadingRows = true;
    this.dataTablesService.listRows(table._id).subscribe({
      next: (loaded) => {
        this.rows = this.buildRowsFromLoaded(table.schema, loaded || []);
        this.totalTableRowCount = (loaded || []).length;
        this.isLoadingRows = false;
      },
      error: (err) => {
        this.isLoadingRows = false;
        this.rows = this.buildRowsFromLoaded(table.schema, []);
        this.totalTableRowCount = 0;
        this.logger.error('[DATA-TABLES] listRows error', err);
      },
    });
  }

  private buildRowsFromLoaded(schema: Column[] | undefined, loaded: RowListItem[]): EditableRow[] {
    if (!schema?.length) {
      return [];
    }
    if (!loaded.length) {
      return [this.createEmptyRow(schema)];
    }
    return loaded.map((item, index) => {
      const data: RowData = { ...item };
      delete data._id;
      return {
        localId: item._id || `row-${index}-${this.newLocalId()}`,
        _id: item._id,
        data: this.normalizeRowData(data, schema),
      };
    });
  }

  private createEmptyRow(schema: Column[]): EditableRow {
    const data: RowData = {};
    schema.forEach((column) => {
      data[column.name] = '';
    });
    return { localId: this.newLocalId(), data };
  }

  private normalizeRowData(data: RowData, schema: Column[]): RowData {
    const normalized: RowData = {};
    schema.forEach((column) => {
      normalized[column.name] = data?.[column.name] ?? '';
    });
    return normalized;
  }

  private newLocalId(): string {
    this.localIdCounter += 1;
    return `local-${Date.now()}-${this.localIdCounter}`;
  }

  private rowHasAnyValue(row: EditableRow): boolean {
    return Object.values(row.data).some((v) => v !== '' && v != null);
  }

  // ─── Sidebar / last-table persistence ───────────────────────────────────

  private lastTableStorageKey(): string {
    return `last_datatable-${this.id_project}`;
  }

  private persistLastTable(table: DataTable): void {
    if (!this.id_project || !table._id) { return; }
    this.localDbService.setInStorage(this.lastTableStorageKey(), table._id);
  }

  private getStoredTableId(): string | null {
    if (!this.id_project) { return null; }
    return this.localDbService.getFromStorage(this.lastTableStorageKey()) || null;
  }

  /** Restore last opened table from storage, or select the first in the list. */
  private selectInitialTable(): void {
    if (!this.tables.length) {
      this.selectedTable = null;
      this.selectedTableId = null;
      this.rows = [];
      return;
    }

    const storedId = this.getStoredTableId();
    const fromStorage = storedId
      ? this.tables.find((t) => t._id === storedId)
      : null;
    const tableToSelect = fromStorage || this.tables[0];

    if (storedId && !fromStorage) {
      this.localDbService.removeFromStorage(this.lastTableStorageKey());
    }

    this.selectTable(tableToSelect);
  }

  private selectTable(table: DataTable): void {
    this.selectedTableId = table._id || null;
    this.selectedTable = table;
    this.persistLastTable(table);
    this.loadTableRows(table);
  }

  onSelectTable(table: DataTable): void {
    this.selectTable(table);
  }

  isTableSelected(table: DataTable): boolean {
    if (!this.selectedTableId || !table._id) {
      return table === this.selectedTable;
    }
    return table._id === this.selectedTableId;
  }

  trackByTableId = (_: number, t: DataTable): string => t._id || t.name || '';

  // ─── Columns view ────────────────────────────────────────────────────────

  getColumns(table: DataTable | null): ColumnView[] {
    if (!table || !table.schema) { return []; }
    return [...table.schema]
      .sort((a, b) => a.index - b.index)
      .map((column) => ({ id: column.id, name: column.name, type: column.type }));
  }

  trackByColumnName = (_: number, c: ColumnView): string => c.name;

  trackByRowId = (_: number, row: EditableRow): string => row.localId;

  // ─── Create table modal ─────────────────────────────────────────────────

  openCreateTableModal(): void {
    const ref = this.dialog.open<CreateTableModalComponent, undefined, CreateTableModalResult>(
      CreateTableModalComponent,
      {
        width: '520px',
        autoFocus: false,
        disableClose: true,
      },
    );

    ref.afterClosed().subscribe((result) => {
      if (!result) { return; }
      this.createTable(result.name, result.schema);
    });
  }

  private createTable(name: string, schema: ColumnInput[]): void {
    this.dataTablesService.createTable({ name, schema }).subscribe({
      next: (table) => {
        this.logger.log('[DATA-TABLES] table created', table);
        this.tables = [...this.tables, table];
        this.selectTable(table);
      },
      error: (err) => {
        this.logger.error('[DATA-TABLES] createTable error', err);
      },
    });
  }

  // ─── Grid actions ───────────────────────────────────────────────────────

  onAddRow(): void {
    if (!this.selectedTable?.schema || this.isTableRowLimitReached) { return; }
    this.rows = [this.createEmptyRow(this.selectedTable.schema), ...this.rows];
    this.totalTableRowCount += 1;
    this.currentRowsPage = 1;
  }

  prevRowsPage(): void {
    if (this.currentRowsPage > 1) {
      this.currentRowsPage -= 1;
    }
  }

  nextRowsPage(): void {
    if (this.currentRowsPage < this.totalRowsPages) {
      this.currentRowsPage += 1;
    }
  }

  isDeletingRow(row: EditableRow): boolean {
    return this.deletingRowId === row.localId;
  }

  onDeleteRow(row: EditableRow): void {
    if (this.deletingRowId) { return; }

    Swal.fire({
      title: this.translate.instant('AreYouSure') + '?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: this.translate.instant('Delete'),
      cancelButtonText: this.translate.instant('Cancel'),
      reverseButtons: true,
      focusCancel: true,
    }).then((result) => {
      if (result.isConfirmed) {
        this.deleteRow(row);
      }
    });
  }

  private deleteRow(row: EditableRow): void {
    const tableId = this.selectedTable?._id;
    const removeLocally = (): void => {
      this.rows = this.rows.filter((item) => item.localId !== row.localId);
      this.totalTableRowCount = Math.max(0, this.totalTableRowCount - 1);
      this.currentRowsPage = Math.min(this.currentRowsPage, this.totalRowsPages);
    };

    if (!tableId || !row._id) {
      removeLocally();
      return;
    }

    this.deletingRowId = row.localId;
    this.dataTablesService.deleteRow(tableId, { id_row: row._id, data: {} }).subscribe({
      next: () => {
        this.deletingRowId = null;
        removeLocally();
        this.logger.log('[DATA-TABLES] row deleted', row._id);
      },
      error: (err) => {
        this.deletingRowId = null;
        this.logger.error('[DATA-TABLES] deleteRow error', err);
        this.notify.showWidgetStyleUpdateNotification(
          this.translate.instant('Error'),
          4,
          'report_problem',
        );
      },
    });
  }

  onCellBlur(row: EditableRow, columnName: string): void {
    const tableId = this.selectedTable?._id;
    if (!tableId || row.isSaving) { return; }

    if (row._id) {
      row.isSaving = true;
      this.dataTablesService.updateRow(tableId, {
        id_row: row._id,
        data: { [columnName]: row.data[columnName] ?? '' },
      }).subscribe({
        next: () => { row.isSaving = false; },
        error: (err) => {
          row.isSaving = false;
          this.logger.error('[DATA-TABLES] updateRow error', err);
        },
      });
      return;
    }

    if (!this.rowHasAnyValue(row)) { return; }

    row.isSaving = true;
    this.dataTablesService.insertRow(tableId, { data: { ...row.data } }).subscribe({
      next: (saved) => {
        row._id = saved._id;
        row.isSaving = false;
        if (saved.data && this.selectedTable?.schema) {
          row.data = this.normalizeRowData(saved.data, this.selectedTable.schema);
        }
      },
      error: (err) => {
        row.isSaving = false;
        this.logger.error('[DATA-TABLES] insertRow error', err);
      },
    });
  }

  toggleAddColumnPopover(): void {
    if (this.isAddColumnPopoverOpen) {
      this.closeAddColumnPopover();
    } else {
      this.resetAddColumnForm();
      this.isAddColumnPopoverOpen = true;
    }
  }

  closeAddColumnPopover(): void {
    this.isAddColumnPopoverOpen = false;
  }

  resetAddColumnForm(): void {
    this.newColumnName = '';
    this.newColumnType = 'string';
    this.addColumnNameError = '';
    this.isSavingColumn = false;
  }

  canSubmitAddColumn(): boolean {
    return !!this.newColumnName?.trim() && !this.isSavingColumn;
  }

  onNewColumnNameChange(): void {
    this.addColumnNameError = '';
  }

  // Adds ccolumn from the popover form; on success updates the table schema and adds the new column to all rows with empty value.
  submitAddColumn(): void {
    const columnName = (this.newColumnName || '').trim();
    const table = this.selectedTable;
    if (!columnName || !table?._id || !table.schema) { return; }

    const existingKeys = table.schema.map((column) => column.name.toLowerCase());
    if (existingKeys.includes(columnName.toLowerCase())) {
      this.addColumnNameError = 'duplicate';
      return;
    }

    this.isSavingColumn = true;
    this.dataTablesService.addColumn(table._id, {
      name: columnName,
      type: this.newColumnType as ColumnInput['type'],
    }).subscribe({
      next: (updated) => {
        this.isSavingColumn = false;

        if (!updated?.schema?.some((column) => column.name === columnName)) {
          this.showCreateColumnError();
          return;
        }

        const merged: DataTable = {
          ...table,
          ...updated,
          schema: updated.schema,
        };
        const index = this.tables.findIndex((t) => t._id === table._id);
        if (index >= 0) {
          this.tables[index] = merged;
        }
        this.selectedTable = merged;
        this.rows = this.rows.map((row) => ({
          ...row,
          data: { ...row.data, [columnName]: '' },
        }));
        this.closeAddColumnPopover();
        this.logger.log('[DATA-TABLES] column added', columnName);
      },
      error: (err) => {
        this.isSavingColumn = false;
        this.logger.error('[DATA-TABLES] updateTable (add column) error', err);
        this.showCreateColumnError();
      },
    });
  }

  private showCreateColumnError(): void {
    this.closeAddColumnPopover();
    this.notify.showWidgetStyleUpdateNotification(
      this.translate.instant('DataTables.CreateColumnError'),
      4,
      'report_problem',
    );
  }

  onRenameColumn(col: ColumnView | null): void {
    const table = this.selectedTable;
    if (!col || !table?._id || !table.schema) { return; }

    Swal.fire({
      title: this.translate.instant('DataTables.RenameColumn'),
      input: 'text',
      inputValue: col.name,
      showCancelButton: true,
      confirmButtonText: this.translate.instant('Save'),
      cancelButtonText: this.translate.instant('Cancel'),
      reverseButtons: true,
      inputValidator: (value) => value?.trim()
        ? null
        : this.translate.instant('DataTables.RequiredField'),
    }).then((result) => {
      if (!result.isConfirmed) { return; }

      const newName = (result.value || '').trim();
      if (newName === col.name) { return; }

      const duplicate = table.schema.some((column) =>
        column.id !== col.id && column.name.toLowerCase() === newName.toLowerCase()
      );
      if (duplicate) {
        this.notify.showWidgetStyleUpdateNotification(
          this.translate.instant('DataTables.DuplicateColumnName'),
          4,
          'report_problem',
        );
        return;
      }

      this.dataTablesService.renameColumn(table._id, col.id, { name: newName }).subscribe({
        next: (updated) => this.applyPersistedTable(table, updated),
        error: (err) => {
          this.logger.error('[DATA-TABLES] renameColumn error', err);
          this.showColumnMutationError();
        },
      });
    });
  }

  onDeleteColumn(col: ColumnView | null): void {
    const table = this.selectedTable;
    if (!col || !table?._id) { return; }

    Swal.fire({
      title: this.translate.instant('AreYouSure') + '?',
      text: this.translate.instant('DataTables.DeleteColumnConfirm', { name: col.name }),
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: this.translate.instant('Delete'),
      cancelButtonText: this.translate.instant('Cancel'),
      reverseButtons: true,
    }).then((result) => {
      if (!result.isConfirmed) { return; }

      this.dataTablesService.deleteColumn(table._id, col.id).subscribe({
        next: (updated) => this.applyPersistedTable(table, updated),
        error: (err) => {
          this.logger.error('[DATA-TABLES] deleteColumn error', err);
          this.showColumnMutationError();
        },
      });
    });
  }

  private applyPersistedTable(current: DataTable, updated: DataTable): void {
    const merged: DataTable = { ...current, ...updated };
    this.tables = this.tables.map((table) => table._id === current._id ? merged : table);
    this.selectedTable = merged;
    this.loadTableRows(merged);
  }

  private showColumnMutationError(): void {
    this.notify.showWidgetStyleUpdateNotification(
      this.translate.instant('DataTables.ColumnMutationError'),
      4,
      'report_problem',
    );
  }
}

