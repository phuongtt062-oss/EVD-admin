import { Component, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CATEGORY_OPTIONS, STATUS_OPTIONS } from '../../constants/document.constant';
import { DocumentFormValue } from '../../models/document.model';
import { validateDocumentDraft } from '../../utils/document-validation';
import { DocumentActionsService } from '../../services/document-actions.service';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-document-form',
  standalone: true,
  imports: [FormsModule],
  template: `
    <form class="doc-form" (ngSubmit)="onSubmit()">
      <div class="doc-form__grid">
        <div class="doc-form__field">
          <label class="field-label" for="doc-code">Mã tài liệu *</label>
          <input
            id="doc-code"
            class="field-input w-full"
            [class.input-error]="errors()['code']"
            [ngModel]="form().code"
            (ngModelChange)="updateField('code', $event)"
            name="code"
            maxlength="20"
          />
          @if (errors()['code']) {
            <small class="field-error">{{ errors()['code'] }}</small>
          }
        </div>

        <div class="doc-form__field doc-form__field--full">
          <label class="field-label" for="doc-title">Tiêu đề *</label>
          <input
            id="doc-title"
            class="field-input w-full"
            [class.input-error]="errors()['title']"
            [ngModel]="form().title"
            (ngModelChange)="updateField('title', $event)"
            name="title"
            maxlength="200"
          />
          @if (errors()['title']) {
            <small class="field-error">{{ errors()['title'] }}</small>
          }
        </div>

        <div class="doc-form__field">
          <label class="field-label" for="doc-category">Danh mục *</label>
          <select
            id="doc-category"
            class="field-native-select w-full"
            [class.input-error]="errors()['category']"
            [ngModel]="form().category"
            (ngModelChange)="updateField('category', $event)"
            name="category"
          >
            <option value="">Chọn danh mục</option>
            @for (opt of categoryOptions; track opt.value) {
              <option [value]="opt.value">{{ opt.label }}</option>
            }
          </select>
          @if (errors()['category']) {
            <small class="field-error">{{ errors()['category'] }}</small>
          }
        </div>

        <div class="doc-form__field">
          <label class="field-label" for="doc-status">Trạng thái *</label>
          <select
            id="doc-status"
            class="field-native-select w-full"
            [class.input-error]="errors()['status']"
            [ngModel]="form().status"
            (ngModelChange)="updateField('status', $event)"
            name="status"
          >
            <option value="">Chọn trạng thái</option>
            @for (opt of statusOptions; track opt.value) {
              <option [value]="opt.value">{{ opt.label }}</option>
            }
          </select>
          @if (errors()['status']) {
            <small class="field-error">{{ errors()['status'] }}</small>
          }
        </div>
      </div>

      <div class="doc-form__actions">
        <button type="button" class="btn btn--outline" (click)="actions.closeForm()">Huỷ</button>
        <button type="submit" class="btn" [disabled]="submitting()">
          {{ submitting() ? 'Đang lưu...' : 'Lưu' }}
        </button>
      </div>
    </form>
  `,
  styles: `
    .doc-form__grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }

    .doc-form__field--full {
      grid-column: 1 / -1;
    }

    .doc-form__actions {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      margin-top: 24px;
      padding-top: 16px;
      border-top: 1px solid var(--border);
    }

    @media (max-width: 600px) {
      .doc-form__grid {
        grid-template-columns: 1fr;
      }
    }
  `,
})
export class DocumentFormComponent {
  readonly actions = inject(DocumentActionsService);
  private readonly toast = inject(ToastService);

  readonly form = signal<DocumentFormValue>({ code: '', title: '', category: '', status: '' });
  readonly errors = signal<Partial<Record<keyof DocumentFormValue, string>>>({});
  readonly submitting = signal(false);
  readonly categoryOptions = CATEGORY_OPTIONS;
  readonly statusOptions = STATUS_OPTIONS;

  constructor() {
    effect(() => {
      if (this.actions.formOpen()) {
        this.form.set({ code: '', title: '', category: '', status: '' });
        this.errors.set({});
        this.submitting.set(false);
      }
    });
  }

  updateField(field: keyof DocumentFormValue, value: string): void {
    this.form.update((current) => ({ ...current, [field]: value }));
  }

  onSubmit(): void {
    const formValue = this.form();
    const validationErrors = validateDocumentDraft(formValue);
    this.errors.set(validationErrors);
    if (Object.keys(validationErrors).length) return;

    this.submitting.set(true);
    this.actions.saveForm(
      formValue,
      () => {
        this.toast.success('Tạo mới thành công');
        this.submitting.set(false);
      },
      (msg) => {
        this.toast.error(msg);
        this.submitting.set(false);
      }
    );
  }
}
