import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { MotionOptions } from '@primeuix/motion';
import { Meta, Eixo, Setor } from '../../models/meta.model';
import { MetaService } from '../../services/meta';
import { EixoService } from '../../services/eixo.service';
import { SetorService } from '../../services/setor.service';
import { CoordenadorService, Coordenador } from '../../services/coordenador.service';
import { Auth } from '../../../../core/services/auth';

@Component({
  selector: 'app-meta-estrutural-modal',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule, 
    DialogModule, 
    InputTextModule, 
    TextareaModule, 
    InputNumberModule, 
    SelectModule, 
    DatePickerModule
  ],
  templateUrl: './meta-estrutural-modal.html',
  styleUrl: './meta-estrutural-modal.scss'
})
export class MetaEstruturalModal implements OnChanges, OnInit {
  @Input() display = false;
  @Input() metaParaEditar: Meta | null = null;
  @Input() readonly = false;
  @Output() displayChange = new EventEmitter<boolean>();
  @Output() salvoSucesso = new EventEmitter<Meta>();
  @Output() excluidoSucesso = new EventEmitter<string>();

  readonly dialogMotionOptions: MotionOptions = {
    type: 'animation',
    duration: { leave: 300 },
    leaveClass: { active: 'meta-dialog-leave-active' },
  };

  metaForm: FormGroup;
  isSaving = false;
  isDeleting = false;
  editSection: 'estrutura' | 'preenchimento' = 'preenchimento';

  eixos: Eixo[] = [];
  setores: Setor[] = [];
  coordenadores: Coordenador[] = [];
  private auxiliaresLoaded = false;
  private auxiliaresLoading = false;

  statusOptions = [
    { label: 'Pendente', value: 'PENDENTE' },
    { label: 'Não se Aplica', value: 'NAO_SE_APLICA' },
    { label: 'Em Andamento', value: 'EM_ANDAMENTO' },
    { label: 'Parcialmente Cumprida', value: 'PARCIALMENTE_CUMPRIDA' },
    { label: 'Totalmente Cumprida', value: 'TOTALMENTE_CUMPRIDA' },
    { label: 'Não Cumprida', value: 'NAO_CUMPRIDA' }
  ];

  nivelDificuldadeOptions = [
    { label: 'Sem dificuldades', value: 'SEM_DIFICULDADES' },
    { label: 'Em alerta', value: 'EM_ALERTA' },
    { label: 'Situação crítica', value: 'SITUACAO_CRITICA' }
  ];

  private statusConclusao = ['TOTALMENTE_CUMPRIDA', 'PARCIALMENTE_CUMPRIDA', 'NAO_CUMPRIDA'];

  constructor(
    private fb: FormBuilder, 
    private metaService: MetaService,
    private eixoService: EixoService,
    private setorService: SetorService,
    private coordenadorService: CoordenadorService,
    public auth: Auth
  ) {
    this.metaForm = this.fb.group({
      titulo: ['', Validators.required],
      descricao: [''],
      status: ['PENDENTE', Validators.required],
      eixoId: [null, [Validators.required]],
      setorId: [null, [Validators.required]],
      coordenadorId: [null],
      artigo: [''],
      anoCiclo: [new Date().getFullYear(), [Validators.required, Validators.min(2000)]],
      deadline: [null],
      pMaximo: [0, [Validators.required, Validators.min(0)]],
      estimativaReal: [0],
      tetoEstimado: [0],
      pontosAtingidos: [0],
      nivelDificuldade: ['SEM_DIFICULDADES'],
      evidenciasAuditoria: [''],
      observacoes: ['']
    });
  }

  ngOnInit(): void {
    this.metaForm.get('status')?.valueChanges.subscribe(status => {
      this.atualizarValidadores(status);
    });
    this.metaForm.get('pMaximo')?.valueChanges.subscribe(() => {
      this.atualizarValidadores(this.metaForm.get('status')?.value);
    });
  }

  private carregarAuxiliares(): void {
    if (!this.deveCarregarAuxiliares() || this.auxiliaresLoaded || this.auxiliaresLoading) {
      return;
    }

    this.auxiliaresLoading = true;

    forkJoin({
      eixos: this.eixoService.listarTodos(),
      setores: this.setorService.listarTodos(),
      coordenadores: this.coordenadorService.listarTodos(),
    }).subscribe({
      next: ({ eixos, setores, coordenadores }) => {
        this.eixos = eixos;
        this.setores = setores;
        this.coordenadores = coordenadores;
        this.auxiliaresLoaded = true;
        this.auxiliaresLoading = false;
      },
      error: (err) => {
        console.error('Erro ao carregar dados auxiliares da meta', err);
        this.auxiliaresLoading = false;
      }
    });
  }

  private deveCarregarAuxiliares(): boolean {
    return this.display && !this.readonly && !this.isCoordenadorAndEditing() && this.auth.isLoggedIn();
  }

  atualizarValidadores(status: string | null): void {
    const s = status || 'PENDENTE';
    const tetoControl = this.metaForm.get('tetoEstimado');
    const estimativaControl = this.metaForm.get('estimativaReal');
    const atingidosControl = this.metaForm.get('pontosAtingidos');
    const pMaximoVal = this.metaForm.get('pMaximo')?.value || 0;

    // Inicialmente limpar validadores (além do min atualizamos se aplicável)
    tetoControl?.clearValidators();
    estimativaControl?.clearValidators();
    atingidosControl?.clearValidators();

    // Resetar estado basico para reavaliar (exceto se em modo readonly geral)
    if (!this.readonly) {
        tetoControl?.enable({ emitEvent: false });
        estimativaControl?.enable({ emitEvent: false });
    }

    if (s === 'EM ANDAMENTO' || s === 'EM_ANDAMENTO') {
      tetoControl?.setValidators([Validators.min(0)]);
      estimativaControl?.setValidators([Validators.min(0)]);
      atingidosControl?.disable({ emitEvent: false });
    } else if (s === 'CONCLUÍDA' || s === 'TOTALMENTE_CUMPRIDA') {
      atingidosControl?.setValue(pMaximoVal);
      atingidosControl?.disable({ emitEvent: false });
    } else if (s === 'NAO_CUMPRIDA') {
      atingidosControl?.setValue(0);
      atingidosControl?.disable({ emitEvent: false });
    } else if (s === 'PARCIALMENTE_CUMPRIDA') {
      if (!this.readonly) atingidosControl?.enable({ emitEvent: false });
      atingidosControl?.setValidators([Validators.min(0)]);
    } else {
      atingidosControl?.disable({ emitEvent: false });
    }

    tetoControl?.updateValueAndValidity();
    estimativaControl?.updateValueAndValidity();
    atingidosControl?.updateValueAndValidity();

    // Validação de Evidências para Auditoria
    const evidenciasControl = this.metaForm.get('evidenciasAuditoria');
    if (this.statusConclusao.includes(s)) {
      evidenciasControl?.setValidators([Validators.required, Validators.minLength(20)]);
    } else {
      evidenciasControl?.clearValidators();
    }
    evidenciasControl?.updateValueAndValidity();
  }

  isStatusConclusao(): boolean {
    const s = this.metaForm.get('status')?.value || 'PENDENTE';
    return this.statusConclusao.includes(s);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['display'] && this.display) {
      this.editSection = this.isDigovAndEditing() ? 'preenchimento' : 'estrutura';
      this.carregarAuxiliares();
      this.isSaving = false;
      this.isDeleting = false;
      if (this.metaParaEditar) {
        this.preencherFormulario(this.metaParaEditar);
      } else {
        this.metaForm.reset({
          status: 'PENDENTE',
          anoCiclo: new Date().getFullYear(),
          pMaximo: 0,
          estimativaReal: 0,
          tetoEstimado: 0,
          pontosAtingidos: 0,
          nivelDificuldade: 'SEM_DIFICULDADES',
          evidenciasAuditoria: '',
          coordenadorId: null,
          observacoes: ''
        });
        this.atualizarValidadores('PENDENTE');
      }

      if (this.readonly) {
        this.metaForm.disable();
      } else {
        this.metaForm.enable();
        // Se for coordenador editando, trava campos específicos
        if (this.isCoordenadorAndEditing()) {
          const fieldsToLock = ['titulo', 'descricao', 'artigo', 'eixoId', 'setorId', 'anoCiclo', 'deadline', 'pMaximo', 'coordenadorId'];
          fieldsToLock.forEach(field => this.metaForm.get(field)?.disable({ emitEvent: false }));
        }
      }
    }
  }

  isCoordenadorAndEditing(): boolean {
    return !!this.metaParaEditar && this.auth.isCoordenador() && !this.auth.isDigov();
  }

  isDigovAndEditing(): boolean {
    return !!this.metaParaEditar && this.auth.isDigov();
  }

  showDigovEditSections(): boolean {
    return !this.readonly && this.isDigovAndEditing();
  }

  setEditSection(section: 'estrutura' | 'preenchimento'): void {
    this.editSection = section;
  }

  showResumoEdicao(): boolean {
    return !!this.metaParaEditar;
  }

  showEstruturaFields(): boolean {
    return !this.showDigovEditSections() || this.editSection === 'estrutura';
  }

  showPreenchimentoFields(): boolean {
    return !this.showDigovEditSections() || this.editSection === 'preenchimento';
  }

  canShowDeleteAction(): boolean {
    return this.showDigovEditSections() && this.editSection === 'estrutura' && !!this.metaParaEditar;
  }

  formatNivelDificuldade(value: string | undefined): string {
    switch (value) {
      case 'EM_ALERTA':
        return 'Em Alerta';
      case 'SITUACAO_CRITICA':
        return 'Situação Crítica';
      case 'SEM_DIFICULDADES':
      default:
        return 'Sem Dificuldades';
    }
  }

  getNivelDificuldadeClass(value: string | undefined): string {
    switch (value) {
      case 'EM_ALERTA':
        return 'difficulty-badge difficulty-badge--warning';
      case 'SITUACAO_CRITICA':
        return 'difficulty-badge difficulty-badge--danger';
      case 'SEM_DIFICULDADES':
      default:
        return 'difficulty-badge difficulty-badge--success';
    }
  }

  formatStatus(status: string | undefined): string {
    const s = status || 'PENDENTE';
    const option = this.statusOptions.find(o => o.value === s);
    return option ? option.label : s;
  }

  getEixoNome(id: number | undefined): string {
    const eixo = this.eixos.find(e => e.id === id);
    return eixo ? eixo.nome : (this.metaParaEditar?.eixoNome || 'N/A');
  }

  getSetorNome(id: number | undefined): string {
    const setor = this.setores.find(s => s.id === id);
    return setor ? (setor.sigla || setor.nome) : (this.metaParaEditar?.setorNome || 'N/A');
  }

  preencherFormulario(meta: Meta): void {
    this.metaForm.patchValue({
      titulo: meta.titulo,
      descricao: meta.descricao,
      status: meta.status || 'PENDENTE',
      eixoId: meta.eixoId,
      setorId: meta.setorId,
      coordenadorId: meta.coordenadorId,
      artigo: meta.artigo,
      anoCiclo: meta.anoCiclo,
      deadline: meta.deadline ? new Date(meta.deadline) : null,
      pMaximo: meta.pMaximo,
      estimativaReal: meta.estimativaReal || 0,
      tetoEstimado: meta.tetoEstimado || 0,
      pontosAtingidos: meta.pontosAtingidos || 0,
      nivelDificuldade: meta.nivelDificuldade || 'SEM_DIFICULDADES',
      evidenciasAuditoria: meta.evidenciasAuditoria || '',
      observacoes: meta.observacoes || ''
    });
    this.atualizarValidadores(meta.status || 'PENDENTE');
  }

  fechar(): void {
    this.display = false;
    this.displayChange.emit(this.display);
  }

  salvar(): void {
    if (this.metaForm.invalid) {
      this.metaForm.markAllAsTouched();
      return;
    }

    this.isSaving = true;
    
    // getRawValue garante que campos desabilitados (como pMaximo se estiver travado) sejam incluídos
    const formValue = this.metaForm.getRawValue();

    const payload = {
      ...formValue,
      id: this.metaParaEditar ? this.metaParaEditar.id : undefined,
      pMaximo: this.isCoordenadorAndEditing() ? this.metaParaEditar?.pMaximo : formValue.pMaximo,
      // Garantir que não enviamos nulos para campos numéricos que o back pode validar
      estimativaReal: formValue.estimativaReal ?? 0,
      tetoEstimado: formValue.tetoEstimado ?? 0,
      pontosAtingidos: formValue.pontosAtingidos ?? 0
    };

    const request$ = this.metaParaEditar 
      ? this.metaService.atualizar(this.metaParaEditar.id, payload)
      : this.metaService.criar(payload);

    request$.subscribe({
      next: (metaSalva) => {
        this.isSaving = false;
        this.salvoSucesso.emit(metaSalva);
      },
      error: (err) => {
        console.error('Erro ao salvar meta', err);
        alert('Ocorreu um erro ao salvar a meta. Tente novamente.');
        this.isSaving = false;
      }
    });
  }

  excluirMeta(): void {
    if (!this.metaParaEditar || this.isDeleting) {
      return;
    }

    const metaId = this.metaParaEditar.id;

    const confirmado = window.confirm(`Deseja realmente excluir a meta "${this.metaParaEditar.titulo}"?`);
    if (!confirmado) {
      return;
    }

    this.isDeleting = true;

    this.metaService.deletar(this.metaParaEditar.id).subscribe({
      next: () => {
        this.isDeleting = false;
        this.fechar();
        this.excluidoSucesso.emit(metaId);
      },
      error: (err) => {
        console.error('Erro ao excluir meta', err);
        alert('Ocorreu um erro ao excluir a meta. Tente novamente.');
        this.isDeleting = false;
      }
    });
  }

  getStatusBadgeClass(status: string | undefined): string {
    const s = (status || '').toUpperCase();
    if (s === 'TOTALMENTE_CUMPRIDA' || s === 'CONCLUÍDA' || s === 'CONCLUIDA' || s === 'CONCLUIDO') {
      return 'bg-green-100';
    } else if (s === 'PENDENTE') {
      return 'bg-yellow-100';
    } else if (s === 'EM_ANDAMENTO' || s === 'EM ANDAMENTO') {
      return 'bg-blue-100';
    } else if (s === 'NAO_CUMPRIDA') {
      return 'bg-red-100';
    }
    return 'bg-gray-100';
  }
}
