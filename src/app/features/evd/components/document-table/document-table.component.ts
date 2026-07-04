import { DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  CATEGORY_LABELS,
  CATEGORY_OPTIONS,
  STATUS_LABELS,
  STATUS_OPTIONS,
} from '../../constants/document.constant';
import { DocumentActionsService } from '../../services/document-actions.service';
import { DocumentListService } from '../../services/document-list.service';
import { DocumentRowEditService } from '../../services/document-row-edit.service';
import { AuthService } from '../../../../core/services/auth.service';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-document-table',
  standalone: true,
  imports: [FormsModule, DatePipe],
  template: `
    @if (rowEdit.dirtyRowCount() > 0) {
      <div class="table-bulk-bar">
        <span class="table-bulk-bar__text">
          {{ rowEdit.dirtyRowCount() }} hàng có thay đổi chưa lưu
        </span>
        <div class="table-bulk-bar__actions">
          <button
            type="button"
            class="btn btn--sm"
            [disabled]="rowEdit.bulkSaving() || rowEdit.hasDirtyRowErrors()"
            (click)="saveAllRows()"
          >
            {{ rowEdit.bulkSaving() ? 'Đang lưu...' : 'Lưu hàng loạt' }}
          </button>
          <button
            type="button"
            class="btn btn--sm btn--outline"
            [disabled]="rowEdit.bulkSaving()"
            (click)="rowEdit.cancelAllDirtyRows()"
          >
            Huỷ tất cả
          </button>
        </div>
      </div>
    }

    <div class="data-table-wrap">
      <table class="data-table data-table--inline-edit">
        <colgroup>
          <col style="width: 9%" />
          <col style="width: 24%" />
          <col style="width: 11%" />
          <col style="width: 11%" />
          <col style="width: 13%" />
          <col style="width: 12%" />
          <col style="width: 20%" />
        </colgroup>
        <thead>
          <tr>
            <th>Mã</th>
            <th>Tiêu đề</th>
            <th>Danh mục</th>
            <th>Trạng thái</th>
            <th>Người tạo</th>
            <th>Ngày tạo</th>
            <th>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          @for (doc of list.documents(); track doc.id) {
            @let row = rowEdit.getRowState(doc);
            @let editing = rowEdit.isRowEditing(doc.id);
            <tr
              [class.row-editing]="editing"
              [class.row-dirty]="row.dirtyFields.size > 0"
              [class.row-invalid]="hasRowErrors(row)"
              [class.row-saving]="row.saving"
            >
              <td class="cell-editable">
                <div class="cell-content">
                  @if (editing) {
                    <input
                      class="field-input field-input--table w-full"
                      [class.input-error]="row.fieldErrors['code']"
                      [ngModel]="row.draft.code"
                      (ngModelChange)="rowEdit.updateRowField(doc.id, 'code', $event)"
                    />
                  } @else {
                    <span class="cell-text" [title]="doc.code">{{ doc.code }}</span>
                  }
                  <div class="cell-error-slot">
                    @if (editing && row.fieldErrors['code']) {
                      <small class="field-error">{{ row.fieldErrors['code'] }}</small>
                    }
                  </div>
                </div>
              </td>
              <td class="cell-editable">
                <div class="cell-content">
                  @if (editing) {
                    <input
                      class="field-input field-input--table w-full"
                      [class.input-error]="row.fieldErrors['title']"
                      [ngModel]="row.draft.title"
                      (ngModelChange)="rowEdit.updateRowField(doc.id, 'title', $event)"
                    />
                  } @else {
                    <span class="cell-text" [title]="doc.title">{{ doc.title }}</span>
                  }
                  <div class="cell-error-slot">
                    @if (editing && row.fieldErrors['title']) {
                      <small class="field-error">{{ row.fieldErrors['title'] }}</small>
                    }
                  </div>
                </div>
              </td>
              <td class="cell-editable">
                <div class="cell-content">
                  @if (editing) {
                    <select
                      class="field-native-select field-input--table w-full"
                      [class.input-error]="row.fieldErrors['category']"
                      [ngModel]="row.draft.category"
                      (ngModelChange)="rowEdit.updateRowField(doc.id, 'category', $event)"
                    >
                      @for (opt of categoryOptions; track opt.value) {
                        <option [value]="opt.value">{{ opt.label }}</option>
                      }
                    </select>
                  } @else {
                    <span class="cell-text" [title]="labels.category[doc.category]">{{
                      labels.category[doc.category]
                    }}</span>
                  }
                  <div class="cell-error-slot">
                    @if (editing && row.fieldErrors['category']) {
                      <small class="field-error">{{ row.fieldErrors['category'] }}</small>
                    }
                  </div>
                </div>
              </td>
              <td class="cell-editable">
                <div class="cell-content">
                  @if (editing) {
                    <select
                      class="field-native-select field-input--table w-full"
                      [class.input-error]="row.fieldErrors['status']"
                      [ngModel]="row.draft.status"
                      (ngModelChange)="rowEdit.updateRowField(doc.id, 'status', $event)"
                    >
                      @for (opt of statusOptions; track opt.value) {
                        <option [value]="opt.value">{{ opt.label }}</option>
                      }
                    </select>
                  } @else {
                    <span class="cell-text" [title]="labels.status[doc.status]">{{ labels.status[doc.status] }}</span>
                  }
                  <div class="cell-error-slot">
                    @if (editing && row.fieldErrors['status']) {
                      <small class="field-error">{{ row.fieldErrors['status'] }}</small>
                    }
                  </div>
                </div>
              </td>
              <td>
                <div class="cell-content">
                  <span class="cell-text" [title]="doc.createdBy">{{ doc.createdBy }}</span>
                </div>
              </td>
              <td>
                <div class="cell-content">
                  <span class="cell-text">{{ doc.createdDate | date: 'dd/MM/yyyy HH:mm' }}</span>
                </div>
              </td>
              <td class="cell-actions">
                <div class="row-actions">
                  @if (editing) {
                    @if (row.dirtyFields.size > 0) {
                      <button
                        type="button"
                        class="btn btn--sm"
                        [disabled]="row.saving || hasRowErrors(row)"
                        (click)="saveRow(doc.id)"
                      >
                        {{ row.saving ? '...' : 'Lưu' }}
                      </button>
                    }
                    <button
                      type="button"
                      class="btn btn--sm btn--outline"
                      [disabled]="row.saving"
                      (click)="rowEdit.cancelRow(doc.id)"
                    >
                      {{ row.dirtyFields.size > 0 ? 'Huỷ' : 'Đóng' }}
                    </button>
                  } @else {
                    <button type="button" class="btn btn--sm btn--outline" (click)="rowEdit.startRowEdit(doc.id)">
                      Sửa
                    </button>
                  }
                  @if (auth.canDelete() && !editing) {
                    <button
                      type="button"
                      class="btn btn--sm btn--outline-danger"
                      (click)="actions.openDeleteConfirm(doc)"
                    >
                      Xóa
                    </button>
                  }
                </div>
              </td>
            </tr>
          }
        </tbody>
      </table>
    </div>
  `,
  styles: `
    .table-bulk-bar {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 12px;
      padding: 12px 14px;
      border: 1px solid color-mix(in srgb, var(--color-primary) 25%, var(--border));
      border-radius: 12px;
      background: color-mix(in srgb, var(--color-primary) 6%, #fff);
    }

    .table-bulk-bar__text {
      font-size: 0.88rem;
      font-weight: 600;
    }

    .table-bulk-bar__actions {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .data-table--inline-edit {
      table-layout: fixed;
      width: 100%;
    }

    .data-table--inline-edit th,
    .data-table--inline-edit td {
      overflow: hidden;
      vertical-align: top;
    }

    .cell-content {
      width: 100%;
      min-height: calc(36px + 1.125rem);
    }

    .cell-text {
      display: block;
      box-sizing: border-box;
      width: 100%;
      height: 36px;
      line-height: 36px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .cell-error-slot {
      min-height: 1.125rem;
    }

    .field-input.field-input--table,
    .field-native-select.field-input--table {
      box-sizing: border-box;
      width: 100%;
      max-width: 100%;
      height: 36px;
      min-height: 36px;
      padding: 6px 10px;
      font-size: 0.85rem;
      border-radius: 8px;
    }

    .row-actions {
      display: flex;
      flex-wrap: nowrap;
      gap: 4px;
      width: 100%;
      min-height: calc(36px + 1.125rem);
      align-items: flex-start;
    }

    .row-actions .btn {
      flex: 0 1 auto;
      min-width: 0;
      padding-left: 8px;
      padding-right: 8px;
      white-space: nowrap;
    }

    tbody tr.row-editing,
    tbody tr.row-dirty {
      background: color-mix(in srgb, var(--color-primary) 5%, #fff);
    }

    tbody tr.row-invalid {
      background: color-mix(in srgb, var(--color-danger) 4%, #fff);
    }

    tbody tr.row-saving {
      opacity: 0.75;
    }
  `,
})
export class DocumentTableComponent {
  readonly list = inject(DocumentListService);
  readonly rowEdit = inject(DocumentRowEditService);
  readonly actions = inject(DocumentActionsService);
  readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);

  readonly categoryOptions = CATEGORY_OPTIONS;
  readonly statusOptions = STATUS_OPTIONS;
  readonly labels = { category: CATEGORY_LABELS, status: STATUS_LABELS };

  hasRowErrors(row: { fieldErrors: Record<string, string | undefined> }): boolean {
    return Object.keys(row.fieldErrors).length > 0;
  }

  saveRow(docId: string): void {
    this.rowEdit.saveRow(
      docId,
      () => this.toast.success('Đã lưu hàng'),
      (msg) => this.toast.error(msg)
    );
  }

  saveAllRows(): void {
    this.rowEdit.saveAllDirtyRows(({ saved, failed }) => {
      if (saved > 0 && failed === 0) {
        this.toast.success(`Đã lưu ${saved} hàng`);
      } else if (saved > 0) {
        this.toast.error(`Lưu ${saved} hàng thành công, ${failed} hàng lỗi`);
      } else {
        this.toast.error('Không lưu được hàng nào');
      }
    });
  }
}
