import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MetaService } from '../../services/meta';
import { Auth } from '../../services/auth';

@Component({
  selector: 'app-meta-form',
  imports: [ReactiveFormsModule, RouterLink],
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
    this.metaService.buscarPorId(id).subscribe({
      next: (meta) => {
        this.form.patchValue({
          titulo: meta.titulo,
          descricao: meta.descricao,
          concluida: meta.concluida,
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
}
