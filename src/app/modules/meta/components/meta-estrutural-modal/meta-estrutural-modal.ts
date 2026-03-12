import { ChangeDetectorRef, Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { finalize, forkJoin, Observable } from 'rxjs';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { MotionOptions } from '@primeuix/motion';
import {
  Eixo,
  HistoricoAlteracao,
  Meta,
  MetaAcompanhamentoUpdatePayload,
  MetaCreatePayload,
  MetaEstruturalUpdatePayload,
  Setor,
} from '../../models/meta.model';
import { MetaService } from '../../services/meta';
import { EixoService } from '../../services/eixo.service';
import { SetorService } from '../../services/setor.service';
import { CoordenadorService, Coordenador } from '../../services/coordenador.service';
import { Auth } from '../../../../core/services/auth';

interface MetaFormValue {
  titulo: string;
  descricao: string;
  status: string;
  eixoId: number | null;
  setorId: number | null;
  coordenadorId: number | null;
  artigo: string;
  anoCiclo: number;
  deadline: Date | null;
  pMaximo: number;
  estimativaReal: number | null;
  tetoEstimado: number | null;
  pontosAtingidos: number | null;
  nivelDificuldade: string;
  evidenciasAuditoria: string;
  observacoes: string;
}

type EditSection = 'estrutura' | 'preenchimento' | 'historico';

const HISTORICO_FIELD_LABELS: Record<string, string> = {
  titulo: 'Título',
  descricao: 'Descrição',
  status: 'Status',
  eixoId: 'Eixo temático',
  eixoNome: 'Eixo temático',
  setorId: 'Setor responsável',
  setorNome: 'Setor responsável',
  coordenadorId: 'Coordenador',
  coordenadorNome: 'Coordenador',
  artigo: 'Artigo',
  anoCiclo: 'Ano do ciclo',
  deadline: 'Prazo',
  pMaximo: 'Pontos aplicáveis',
  estimativaReal: 'Estimativa Real',
  tetoEstimado: 'Teto estimado',
  pontosAtingidos: 'Pontos atingidos',
  nivelDificuldade: 'Nível de dificuldade',
  evidenciasAuditoria: 'Evidências para auditoria',
  observacoes: 'Observações',
  dataCriacao: 'Data de criação',
  data_criacao: 'Data de criação',
  usuarioAtualizacao: 'Usuário de atualização',
  usuarioCriacao: 'Usuário de criação',
};

const HISTORICO_FIELDS_OCULTOS = new Set([
  'dataatualizacao',
  'updatedat',
  'ultimaatualizacao',
  'dtatualizacao',
  'modifiedat',
  'lastupdated',
  'id',
]);

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
  editSection: EditSection = 'preenchimento';
  historico: HistoricoAlteracao[] = [];
  historicoLoading = false;
  historicoError = '';

  eixos: Eixo[] = [];
  setores: Setor[] = [];
  coordenadores: Coordenador[] = [];
  private auxiliaresLoaded = false;
  private auxiliaresLoading = false;
  private historicoLoadedForMetaId: string | null = null;
  private isClosing = false;

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
    private cdr: ChangeDetectorRef,
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
    return this.display && !this.readonly && !this.isAcompanhamentoEditor() && this.auth.isLoggedIn();
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
      console.log('[MetaEstruturalModal] Requisito aberto:', {
        metaId: this.metaParaEditar?.id,
        titulo: this.metaParaEditar?.titulo,
        status: this.metaParaEditar?.status,
        coordenadorNome: this.metaParaEditar?.coordenadorNome,
        metaCoordenadorLogin: this.metaParaEditar?.coordenadorLoginKeycloak,
        metaDelegadosEmails: this.metaParaEditar?.delegadosEmails,
        email: this.auth.getEmail(),
        podeEditarMeta: this.metaParaEditar ? this.auth.podeEditarMeta(this.metaParaEditar) : null,
        readonly: this.readonly,
      });

      this.isClosing = false;
      this.resetHistoricoState();
      this.editSection = this.getDefaultEditSection();
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
        // Se for responsável ou delegado editando, trava campos estruturais
        if (this.isAcompanhamentoEditor()) {
          const fieldsToLock = ['titulo', 'descricao', 'artigo', 'eixoId', 'setorId', 'anoCiclo', 'deadline', 'pMaximo', 'coordenadorId'];
          fieldsToLock.forEach(field => this.metaForm.get(field)?.disable({ emitEvent: false }));
        }
      }

      if (this.canViewHistoricoTab()) {
        this.carregarHistorico();
      }

      this.cdr.markForCheck();
    }
  }

  isAcompanhamentoEditor(): boolean {
    return !!this.metaParaEditar && !this.auth.isDigov() && this.auth.podeEditarMeta(this.metaParaEditar);
  }

  isDelegadoAndEditing(): boolean {
    return this.isAcompanhamentoEditor() && !this.auth.isCoordenador();
  }

  isDigovAndEditing(): boolean {
    return !!this.metaParaEditar && this.auth.isDigov();
  }

  canShowSectionTabs(): boolean {
    return !this.readonly && !!this.metaParaEditar && this.auth.podeEditarMeta(this.metaParaEditar);
  }

  canViewEstruturaTab(): boolean {
    return this.canShowSectionTabs() && this.auth.isDigov();
  }

  canViewHistoricoTab(): boolean {
    return this.canShowSectionTabs();
  }

  setEditSection(section: EditSection): void {
    if (!this.isSectionAvailable(section)) {
      return;
    }

    this.editSection = section;

    if (section === 'historico') {
      this.carregarHistorico();
    }
  }

  showResumoEdicao(): boolean {
    return !!this.metaParaEditar;
  }

  showPerfilBadge(): boolean {
    return this.auth.isDigov() || this.auth.isCoordenador() || this.isDelegadoAndEditing();
  }

  getPerfilBadgeLabel(): string {
    if (this.auth.isDigov()) {
      return 'DIGOV';
    }

    if (this.auth.isCoordenador()) {
      return 'Coordenador';
    }

    if (this.isDelegadoAndEditing()) {
      return 'Delegado';
    }

    return '';
  }

  getPerfilBadgeIcon(): string {
    if (this.auth.isDigov()) {
      return 'verified_user';
    }

    return 'person';
  }

  getPerfilBadgeClass(): string {
    if (this.auth.isDigov()) {
      return 'hero-chip hero-chip--role hero-chip--role-digov';
    }

    return 'hero-chip hero-chip--role hero-chip--role-coordenador';
  }

  showEstruturaFields(): boolean {
    if (this.canShowSectionTabs()) {
      return this.canViewEstruturaTab() && this.editSection === 'estrutura';
    }

    return !this.isAcompanhamentoEditor();
  }

  showPreenchimentoFields(): boolean {
    if (this.canShowSectionTabs()) {
      return this.editSection === 'preenchimento';
    }

    return true;
  }

  showHistoricoSection(): boolean {
    return this.canViewHistoricoTab() && this.editSection === 'historico';
  }

  canShowDeleteAction(): boolean {
    return this.canViewEstruturaTab() && this.editSection === 'estrutura' && !!this.metaParaEditar;
  }

  getHistoricoTipoLabel(tipo: string): string {
    switch (tipo) {
      case 'CRIACAO':
        return 'Criacao';
      case 'ATUALIZACAO':
        return 'Atualizacao';
      case 'EXCLUSAO':
        return 'Exclusao';
      default:
        return 'Alteracao';
    }
  }

  getHistoricoTipoClass(tipo: string): string {
    switch (tipo) {
      case 'CRIACAO':
        return 'history-badge--created';
      case 'EXCLUSAO':
        return 'history-badge--deleted';
      case 'ATUALIZACAO':
      default:
        return 'history-badge--updated';
    }
  }

  formatHistoricoFieldLabel(fieldName: string): string {
    return HISTORICO_FIELD_LABELS[fieldName] || fieldName;
  }

  formatHistoricoValue(fieldName: string, value: unknown): string {
    if (value === null || value === undefined) {
      return 'Não informado';
    }

    const stringValue = typeof value === 'string' ? value.trim() : String(value);

    if (stringValue === '') {
      return 'Não informado';
    }

    return this.formatarPossivelDataHistorico(fieldName, stringValue);
  }

  private formatarPossivelDataHistorico(fieldName: string, value: string): string {
    if (this.isNivelDificuldadeField(fieldName)) {
      return this.formatNivelDificuldade(value);
    }

    if (this.isDateOnlyField(fieldName)) {
      return this.formatDateOnlyValue(value);
    }

    if (this.isDateTimeField(fieldName)) {
      return this.formatDateTimeValue(value);
    }

    const dateOnlyValue = this.tryFormatDateOnlyValue(value);
    if (dateOnlyValue) {
      return dateOnlyValue;
    }

    const dateTimeValue = this.tryFormatDateTimeValue(value);
    if (dateTimeValue) {
      return dateTimeValue;
    }

    return value;
  }

  private isNivelDificuldadeField(fieldName: string): boolean {
    return ['nivelDificuldade', 'nivel_dificuldade'].includes(fieldName);
  }

  private isDateOnlyField(fieldName: string): boolean {
    return ['deadline', 'prazo'].includes(fieldName);
  }

  private isDateTimeField(fieldName: string): boolean {
    return ['dataCriacao', 'data_criacao', 'createdAt', 'created_at'].includes(fieldName);
  }

  private formatDateOnlyValue(value: string): string {
    return this.tryFormatDateOnlyValue(value) ?? value;
  }

  private formatDateTimeValue(value: string): string {
    return this.tryFormatDateTimeValue(value) ?? value;
  }

  private tryFormatDateOnlyValue(value: string): string | null {
    const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);

    if (!match) {
      return null;
    }

    const [, year, month, day] = match;
    return `${day}/${month}/${year}`;
  }

  private tryFormatDateTimeValue(value: string): string | null {
    const match = value.match(/^(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2})(?::(\d{2}))?(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?$/);

    if (!match) {
      return null;
    }

    const [, year, month, day, hours, minutes, seconds] = match;
    const normalizedSeconds = seconds ?? '00';
    return `${day}/${month}/${year} ${hours}:${minutes}:${normalizedSeconds}`;
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
    this.isClosing = true;
    this.display = false;
    this.displayChange.emit(this.display);
    this.cdr.markForCheck();
  }

  onDialogHide(): void {
    if (this.isClosing) {
      this.isClosing = false;
      return;
    }

    this.display = false;
    this.displayChange.emit(false);
    this.cdr.markForCheck();
  }

  salvar(): void {
    if (this.metaForm.invalid) {
      this.metaForm.markAllAsTouched();
      return;
    }

    this.isSaving = true;

    const formValue = this.metaForm.getRawValue() as MetaFormValue;
    const request$ = this.criarRequisicaoSalvamento(formValue);

    request$.subscribe({
      next: (metaSalva) => {
        this.isSaving = false;
        this.salvoSucesso.emit(metaSalva);
      },
      error: (err) => {
        console.error('Erro ao salvar requisito', err);
        alert('Ocorreu um erro ao salvar o requisito. Tente novamente.');
        this.isSaving = false;
      }
    });
  }

  private criarRequisicaoSalvamento(formValue: MetaFormValue): Observable<Meta> {
    if (!this.metaParaEditar) {
      return this.metaService.criar(this.criarPayloadEstrutural(formValue));
    }

    if (this.isAcompanhamentoEditor()) {
      return this.metaService.updateMetaAcompanhamento(
        this.metaParaEditar.id,
        this.criarPayloadAcompanhamento(formValue)
      );
    }

    return this.metaService.updateMetaEstrutural(
      this.metaParaEditar.id,
      this.criarPayloadEstrutural(formValue)
    );
  }

  private criarPayloadEstrutural(formValue: MetaFormValue): MetaCreatePayload | MetaEstruturalUpdatePayload {
    return {
      titulo: formValue.titulo,
      descricao: formValue.descricao,
      eixoId: formValue.eixoId,
      setorId: formValue.setorId,
      coordenadorId: formValue.coordenadorId ?? null,
      artigo: formValue.artigo,
      anoCiclo: formValue.anoCiclo,
      deadline: formValue.deadline,
      status: formValue.status,
      nivelDificuldade: formValue.nivelDificuldade,
      evidenciasAuditoria: formValue.evidenciasAuditoria,
      observacoes: formValue.observacoes,
      pMaximo: this.normalizarNumero(formValue.pMaximo),
      estimativaReal: this.normalizarNumero(formValue.estimativaReal),
      tetoEstimado: this.normalizarNumero(formValue.tetoEstimado),
      pontosAtingidos: this.normalizarNumero(formValue.pontosAtingidos),
    };
  }

  private criarPayloadAcompanhamento(formValue: MetaFormValue): MetaAcompanhamentoUpdatePayload {
    return {
      status: formValue.status,
      nivelDificuldade: formValue.nivelDificuldade,
      evidenciasAuditoria: formValue.evidenciasAuditoria,
      observacoes: formValue.observacoes,
      estimativaReal: this.normalizarNumero(formValue.estimativaReal),
      tetoEstimado: this.normalizarNumero(formValue.tetoEstimado),
      pontosAtingidos: this.normalizarNumero(formValue.pontosAtingidos),
    };
  }

  private normalizarNumero(value: number | null | undefined): number {
    return value ?? 0;
  }

  private getDefaultEditSection(): EditSection {
    return this.canShowSectionTabs() ? 'preenchimento' : 'estrutura';
  }

  private isSectionAvailable(section: EditSection): boolean {
    if (!this.canShowSectionTabs()) {
      return false;
    }

    switch (section) {
      case 'estrutura':
        return this.canViewEstruturaTab();
      case 'historico':
        return this.canViewHistoricoTab();
      case 'preenchimento':
      default:
        return true;
    }
  }

  private carregarHistorico(): void {
    if (!this.metaParaEditar || !this.canViewHistoricoTab()) {
      return;
    }

    if (this.historicoLoading || this.historicoLoadedForMetaId === this.metaParaEditar.id) {
      return;
    }

    this.historicoLoading = true;
    this.historicoError = '';

    const metaId = this.metaParaEditar.id;

    this.metaService.buscarHistorico(metaId)
      .pipe(finalize(() => {
        this.historicoLoading = false;
      }))
      .subscribe({
      next: (historico) => {
        this.historico = this.normalizarHistorico(historico);
        this.historicoLoadedForMetaId = metaId;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Erro ao carregar histórico do requisito', err);
        this.historico = [];
        this.historicoError = 'Não foi possível carregar o histórico deste requisito.';
        this.cdr.markForCheck();
      }
    });
  }

  private resetHistoricoState(): void {
    this.historico = [];
    this.historicoLoading = false;
    this.historicoError = '';
    this.historicoLoadedForMetaId = null;
  }

  private toTimestamp(value: string | Date): number {
    const parsedDate = new Date(value).getTime();
    return Number.isNaN(parsedDate) ? 0 : parsedDate;
  }

  private normalizarHistorico(historico: unknown): HistoricoAlteracao[] {
    const historicoArray = this.extrairHistoricoArray(historico);

    return historicoArray
      .map((item, index) => this.normalizarHistoricoItem(item, index))
      .filter((item): item is HistoricoAlteracao => item !== null)
      .sort((left, right) => this.toTimestamp(right.dataHora) - this.toTimestamp(left.dataHora));
  }

  private extrairHistoricoArray(historico: unknown): unknown[] {
    if (Array.isArray(historico)) {
      return historico;
    }

    if (historico && typeof historico === 'object') {
      const possibleArray = (historico as { content?: unknown; data?: unknown }).content
        ?? (historico as { content?: unknown; data?: unknown }).data;

      if (Array.isArray(possibleArray)) {
        return possibleArray;
      }
    }

    return [];
  }

  private normalizarHistoricoItem(item: unknown, index: number): HistoricoAlteracao | null {
    if (!item || typeof item !== 'object') {
      return null;
    }

    const historicoItem = item as Partial<HistoricoAlteracao> & {
      propriedadesAlteradas?: unknown;
      propriedades?: unknown;
      changes?: unknown;
    };

    const propriedadesBrutas = historicoItem.propriedadesAlteradas
      ?? historicoItem.propriedades
      ?? historicoItem.changes;

    const propriedadesAlteradas = this.normalizarPropriedadesAlteradas(propriedadesBrutas);

    return {
      id: historicoItem.id ? String(historicoItem.id) : `historico-${index}`,
      autor: historicoItem.autor ? String(historicoItem.autor) : 'Sistema',
      dataHora: historicoItem.dataHora ?? new Date(0).toISOString(),
      tipoMudanca: historicoItem.tipoMudanca ? String(historicoItem.tipoMudanca) : 'ATUALIZACAO',
      propriedadesAlteradas,
    };
  }

  private normalizarPropriedadesAlteradas(propriedades: unknown): Array<{ propriedade: string; valorAntigo: string | null; valorNovo: string | null }> {
    if (!Array.isArray(propriedades)) {
      return [];
    }

    return propriedades
      .map((propriedade) => this.normalizarPropriedadeAlterada(propriedade))
      .filter((propriedade): propriedade is { propriedade: string; valorAntigo: string | null; valorNovo: string | null } => propriedade !== null);
  }

  private normalizarPropriedadeAlterada(propriedade: unknown): { propriedade: string; valorAntigo: string | null; valorNovo: string | null } | null {
    if (!propriedade || typeof propriedade !== 'object') {
      return null;
    }

    const propriedadeAlterada = propriedade as {
      propriedade?: unknown;
      field?: unknown;
      nome?: unknown;
      valorAntigo?: unknown;
      oldValue?: unknown;
      valorNovo?: unknown;
      newValue?: unknown;
    };

    const nomeBruto = propriedadeAlterada.propriedade ?? propriedadeAlterada.field ?? propriedadeAlterada.nome;
    const nomePropriedade = nomeBruto ? String(nomeBruto) : '';

    if (!nomePropriedade || this.isHistoricoFieldOculto(nomePropriedade)) {
      return null;
    }

    return {
      propriedade: nomePropriedade,
      valorAntigo: this.normalizarValorHistorico(propriedadeAlterada.valorAntigo ?? propriedadeAlterada.oldValue),
      valorNovo: this.normalizarValorHistorico(propriedadeAlterada.valorNovo ?? propriedadeAlterada.newValue),
    };
  }

  private normalizarValorHistorico(value: unknown): string | null {
    if (value === null || value === undefined) {
      return null;
    }

    const stringValue = typeof value === 'string' ? value.trim() : String(value);
    return stringValue === '' ? null : stringValue;
  }

  private isHistoricoFieldOculto(fieldName: string): boolean {
    const fieldNameNormalizado = fieldName
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9]/g, '')
      .toLowerCase();

    return HISTORICO_FIELDS_OCULTOS.has(fieldNameNormalizado);
  }

  excluirMeta(): void {
    if (!this.metaParaEditar || this.isDeleting) {
      return;
    }

    const metaId = this.metaParaEditar.id;

    const confirmado = window.confirm(`Deseja realmente excluir o requisito "${this.metaParaEditar.titulo}"?`);
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
        console.error('Erro ao excluir requisito', err);
        alert('Ocorreu um erro ao excluir o requisito. Tente novamente.');
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
