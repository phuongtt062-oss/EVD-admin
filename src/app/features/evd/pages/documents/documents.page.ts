import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PAGE_SIZE_OPTIONS } from '../../../../core/constants/app.constant';
import {
  CATEGORY_FILTER_OPTIONS,
  STATUS_FILTER_OPTIONS,
} from '../../constants/document.constant';
import { DocumentActionsService } from '../../services/document-actions.service';
import { DocumentImportService } from '../../services/document-import.service';
import { DocumentListService } from '../../services/document-list.service';
import { AuthService } from '../../../../core/services/auth.service';
import { DocumentTableComponent } from '../../components/document-table/document-table.component';
import { DocumentFormComponent } from '../../components/document-form/document-form.component';
import { BulkImportComponent } from '../../components/bulk-import/bulk-import.component';
import { ToastService } from '../../../../core/services/toast.service';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { PaginationComponent } from '../../../../shared/components/pagination/pagination.component';
import { SpinnerComponent } from '../../../../shared/components/spinner/spinner.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../../../shared/components/error-state/error-state.component';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-documents-page',
  standalone: true,
  imports: [
    FormsModule,
    DocumentTableComponent,
    DocumentFormComponent,
    BulkImportComponent,
    ModalComponent,
    PaginationComponent,
    SpinnerComponent,
    EmptyStateComponent,
    ErrorStateComponent,
    ConfirmDialogComponent,
  ],
  templateUrl: './documents.page.html',
  styleUrl: './documents.page.scss',
})
export class DocumentsPage implements OnInit {
  readonly list = inject(DocumentListService);
  readonly actions = inject(DocumentActionsService);
  readonly importFlow = inject(DocumentImportService);
  readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);

  readonly pageSizeOptions = [...PAGE_SIZE_OPTIONS];
  readonly statusOptions = STATUS_FILTER_OPTIONS;
  readonly categoryOptions = CATEGORY_FILTER_OPTIONS;

  readonly deleteMessage = () => {
    const code = this.actions.deleteTarget()?.code ?? '';
    return `Bạn có chắc muốn xóa tài liệu "${code}"?`;
  };

  ngOnInit(): void {
    this.list.loadDocuments();
  }

  onConfirmDelete(): void {
    this.actions.confirmDelete(
      () => this.toast.success('Xóa tài liệu thành công'),
      (msg) => this.toast.error(msg)
    );
  }
}
