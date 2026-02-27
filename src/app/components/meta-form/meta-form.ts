import { Component, OnInit, ChangeDetectorRef, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { MetaService } from '../../services/meta';
import { Auth } from '../../services/auth';
import { HistoricoAlteracao } from '../../models/meta.model';

@Component({
  selector: 'app-meta-form',
  imports: [ReactiveFormsModule, RouterLink, DatePipe],
  templateUrl: './meta-form.html',
  styleUrl: './meta-form.css',
})
export class MetaForm implements OnInit {

  form!: FormGroup;
  isEditing = false;
  metaId: number | null = null;
  loading = false;
  submitting = false;
  errorMessage = '';

  // Histórico de auditoria (JaVers)
  historico$ = signal<HistoricoAlteracao[]>([]);

  constructor(
    private fb: FormBuilder,
    private metaService: MetaService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef,
    public auth: Auth
  ) { }

  ngOnInit(): void {
    this.form = this.fb.group({
      titulo: ['', [Validators.required, Validators.maxLength(255)]],
      descricao: ['', [Validators.maxLength(2000)]],
      concluida: [false],
    });

    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.isEditing = true;
      this.metaId = +idParam;
      this.carregarMeta(this.metaId);
    }
  }

  carregarMeta(id: number): void {
    this.loading = true;

    // Busca a meta
    this.metaService.buscarPorId(id).subscribe({
      next: (meta) => {
        this.form.patchValue({
          titulo: meta.titulo,
          descricao: meta.descricao,
          concluida: meta.concluida,
        });

        // Busca o histórico de alterações (após carregar a meta ou em paralelo)
        this.metaService.buscarHistorico(id).subscribe({
          next: (historico) => {
            this.historico$.set(historico);
            this.cdr.detectChanges();
          },
          error: (err) => console.error('Erro ao carregar histórico:', err)
        });

        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erro ao carregar meta', err);
        if (err.status === 404) {
          this.router.navigate(['/metas']);
        } else {
          this.errorMessage = 'Não foi possível carregar a meta. Tente novamente.';
          this.loading = false;
          this.cdr.detectChanges();
        }
      },
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting = true;
    this.errorMessage = '';

    const metaData = this.form.value;

    if (this.isEditing && this.metaId !== null) {
      this.metaService.atualizar(this.metaId, metaData).subscribe({
        next: () => {
          this.submitting = false;
          this.router.navigate(['/metas']);
        },
        error: (err) => {
          console.error('Erro ao atualizar meta', err);
          this.errorMessage = 'Erro ao atualizar a meta. Verifique suas permissões.';
          this.submitting = false;
        },
      });
    } else {
      this.metaService.criar(metaData).subscribe({
        next: () => {
          this.submitting = false;
          this.router.navigate(['/metas']);
        },
        error: (err) => {
          console.error('Erro ao criar meta', err);
          this.errorMessage = 'Erro ao criar a meta. Verifique suas permissões.';
          this.submitting = false;
        },
      });
    }
  }

  formatarValorHistorico(valor: string | null | undefined): string {
    if (!valor) return 'Vazio';
    if (valor === 'true') return 'Sim';
    if (valor === 'false') return 'Não';
    return valor;
  }
}
