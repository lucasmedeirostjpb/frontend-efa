import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { DialogModule } from 'primeng/dialog';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';

import { Delegacao, DelegacaoCreatePayload } from '../../models/delegacao.model';
import { DelegacaoService } from '../../services/delegacao.service';

@Component({
  selector: 'app-gerenciar-delegacoes-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DialogModule,
    TableModule,
    InputTextModule,
    ButtonModule,
  ],
  templateUrl: './gerenciar-delegacoes-modal.html',
})
export class GerenciarDelegacoesModal implements OnChanges {
  @Input() display = false;
  @Output() displayChange = new EventEmitter<boolean>();

  delegacoes: Delegacao[] = [];
  loading = false;
  saving = false;
  deletingId: number | null = null;
  loadError = '';
  actionError = '';

  readonly delegacaoForm;

  constructor(
    private readonly fb: FormBuilder,
    private readonly cdr: ChangeDetectorRef,
    private readonly delegacaoService: DelegacaoService,
  ) {
    this.delegacaoForm = this.fb.nonNullable.group({
      email: ['', [Validators.required, Validators.email, Validators.maxLength(160)]],
      nome: ['', [Validators.required, Validators.maxLength(120)]],
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['display'] && this.display) {
      this.actionError = '';
      this.loadDelegacoes();
    }
  }

  get emailControl() {
    return this.delegacaoForm.controls.email;
  }

  get nomeControl() {
    return this.delegacaoForm.controls.nome;
  }

  isAddDisabled(): boolean {
    return this.delegacaoForm.invalid || this.saving;
  }

  close(): void {
    this.display = false;
    this.displayChange.emit(false);
    this.cdr.markForCheck();
  }

  onDialogHide(): void {
    this.display = false;
    this.displayChange.emit(false);
    this.cdr.markForCheck();
  }

  addDelegacao(): void {
    const normalizedEmail = this.normalizeEmail(this.emailControl.value);

    if (normalizedEmail !== this.emailControl.value) {
      this.emailControl.setValue(normalizedEmail);
    }

    if (this.delegacaoForm.invalid) {
      this.delegacaoForm.markAllAsTouched();
      return;
    }

    const formValue = this.delegacaoForm.getRawValue();
    const payload: DelegacaoCreatePayload = {
      delegadoEmail: formValue.email,
      delegadoNome: formValue.nome.trim(),
    };

    this.saving = true;
    this.actionError = '';

    this.delegacaoService
      .adicionarDelegacao(payload)
      .pipe(
        finalize(() => {
          this.saving = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: (delegacao) => {
          this.delegacoes = this.sortDelegacoes([
            ...this.delegacoes.filter((item) => item.id !== delegacao.id),
            delegacao,
          ]);
          this.delegacaoForm.reset({ email: '', nome: '' });
        },
        error: (error: unknown) => {
          console.error('Erro ao adicionar delegação', error);
          this.actionError = this.getActionErrorMessage(error, 'Não foi possível adicionar o assessor. Tente novamente.');
        },
      });
  }

  removeDelegacao(delegacao: Delegacao): void {
    this.deletingId = delegacao.id;
    this.actionError = '';

    this.delegacaoService
      .removerDelegacao(delegacao.id)
      .pipe(
        finalize(() => {
          this.deletingId = null;
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: () => {
          this.delegacoes = this.delegacoes.filter((item) => item.id !== delegacao.id);
        },
        error: (error: unknown) => {
          console.error('Erro ao remover delegação', error);
          this.actionError = this.getActionErrorMessage(error, 'Não foi possível remover o assessor. Tente novamente.');
        },
      });
  }

  private loadDelegacoes(): void {
    this.loading = true;
    this.loadError = '';

    this.delegacaoService
      .listarMinhasDelegacoes()
      .pipe(
        finalize(() => {
          this.loading = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: (delegacoes) => {
          this.delegacoes = this.sortDelegacoes(delegacoes);
        },
        error: (error: unknown) => {
          console.error('Erro ao carregar delegações', error);
          this.delegacoes = [];
          this.loadError = 'Não foi possível carregar os assessores delegados.';
        },
      });
  }

  private sortDelegacoes(delegacoes: Delegacao[]): Delegacao[] {
    return [...delegacoes].sort((left, right) => left.delegadoNome.localeCompare(right.delegadoNome, 'pt-BR'));
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private getActionErrorMessage(error: unknown, fallbackMessage: string): string {
    if (error instanceof HttpErrorResponse) {
      const backendMessage = this.extractBackendMessage(error.error);

      if (backendMessage) {
        return backendMessage;
      }
    }

    return fallbackMessage;
  }

  private extractBackendMessage(errorBody: unknown): string | null {
    if (typeof errorBody === 'string' && errorBody.trim()) {
      return errorBody.trim();
    }

    if (errorBody && typeof errorBody === 'object') {
      const message = (errorBody as { message?: unknown }).message;

      if (typeof message === 'string' && message.trim()) {
        return message.trim();
      }
    }

    return null;
  }
}