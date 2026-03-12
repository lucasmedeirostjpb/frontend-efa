import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { Meta } from '../../models/meta.model';
import { MetaService } from '../../services/meta';
import { Auth } from '../../../../core/services/auth';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { AccordionModule } from 'primeng/accordion';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { MetaEstruturalModal } from '../meta-estrutural-modal/meta-estrutural-modal';

type Agrupamento = 'coordenador' | 'setor';

interface GrupoMeta {
  tituloGrupo: string;
  metas: Meta[];
}

const STATUS_LABELS: Record<string, string> = {
  PENDENTE: 'Pendente',
  EM_ANDAMENTO: 'Em Andamento',
  PARCIALMENTE_CUMPRIDA: 'Parcialmente Cumprida',
  TOTALMENTE_CUMPRIDA: 'Totalmente Cumprida',
  NAO_CUMPRIDA: 'Não Cumprida',
  NAO_SE_APLICA: 'Não se Aplica',
  CONCLUIDA: 'Concluída',
};

@Component({
  selector: 'app-meta-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, CardModule, MetaEstruturalModal, TagModule, AccordionModule, ProgressSpinnerModule],
  templateUrl: './meta-list.html',
  styleUrl: './meta-list.scss',
})
export class MetaList implements OnInit {
  private readonly metaService = inject(MetaService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly router = inject(Router);
  readonly auth = inject(Auth);

  metas: Meta[] = [];
  metasAgrupadas: GrupoMeta[] = [];
  loading = true;
  error = '';

  agrupamento: Agrupamento = 'coordenador';
  readonly agrupamentoOptions: { label: string; value: Agrupamento }[] = [
    { label: 'Por Coordenador', value: 'coordenador' },
    { label: 'Por Setor', value: 'setor' },
  ];
  gruposExpandidos: string[] = [];

  displayModal = false;
  metaSelecionada: Meta | null = null;
  readonlyModal = false;

  private readonly eixosMap: Record<number, string> = {
    1: 'Produtividade',
    2: 'Celeridade',
    3: 'Inovação e Qualidade',
    4: 'Sustentabilidade',
  };

  private readonly setoresMap: Record<number, string> = {
    1: 'Gabinete',
    2: 'Tecnologia da Informação',
    3: 'Gestão de Pessoas',
    4: 'Administrativo',
  };

  ngOnInit(): void {
    this.carregarMetas();
  }

  carregarMetas(): void {
    this.loading = true;
    this.error = '';
    this.metaService
      .listarTodas()
      .pipe(
        finalize(() => {
          this.loading = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
      next: (metas) => {
        this.metas = metas.map((meta) => this.enriquecerMeta(meta));
        this.agruparMetas();
      },
      error: (err: unknown) => {
        console.error('Erro ao carregar requisitos', err);
        this.error = 'Não foi possível carregar os requisitos. Tente novamente.';
      },
    });
  }

  onAgrupamentoChange(): void {
    this.agruparMetas();
  }

  setAgrupamento(agrupamento: Agrupamento): void {
    if (this.agrupamento === agrupamento) {
      return;
    }

    this.agrupamento = agrupamento;
    this.onAgrupamentoChange();
  }

  agruparMetas(): void {
    const grupos = new Map<string, Meta[]>();

    for (const meta of this.metas) {
      const tituloGrupo = this.obterTituloGrupo(meta);
      const grupoExistente = grupos.get(tituloGrupo);

      if (grupoExistente) {
        grupoExistente.push(meta);
        continue;
      }

      grupos.set(tituloGrupo, [meta]);
    }

    this.metasAgrupadas = Array.from(grupos, ([tituloGrupo, metas]) => ({ tituloGrupo, metas })).sort(
      ({ tituloGrupo: grupoA }, { tituloGrupo: grupoB }) => this.compararGrupos(grupoA, grupoB),
    );

    this.sincronizarGruposExpandidos();
  }

  onAccordionValueChange(value: string | number | Array<string | number> | undefined | null): void {
    if (Array.isArray(value)) {
      this.gruposExpandidos = value.map((item) => String(item));
      return;
    }

    this.gruposExpandidos = value !== null && value !== undefined ? [String(value)] : [];
  }

  private enriquecerMeta(meta: Meta): Meta {
    return {
      ...meta,
      eixoNome: meta.eixoNome || this.eixosMap[meta.eixoId] || `Eixo ${meta.eixoId}`,
      setorNome: meta.setorNome || this.setoresMap[meta.setorId] || `Setor ${meta.setorId}`,
    };
  }

  private obterTituloGrupo(meta: Meta): string {
    if (this.agrupamento === 'coordenador') {
      return meta.coordenadorNome?.trim() || 'Sem Coordenador';
    }

    return meta.setorNome?.trim() || 'Sem Setor';
  }

  private compararGrupos(grupoA: string, grupoB: string): number {
    const grupoASemResponsavel = grupoA === 'Sem Coordenador' || grupoA === 'Sem Setor';
    const grupoBSemResponsavel = grupoB === 'Sem Coordenador' || grupoB === 'Sem Setor';

    if (grupoASemResponsavel !== grupoBSemResponsavel) {
      return grupoASemResponsavel ? 1 : -1;
    }

    return grupoA.localeCompare(grupoB, 'pt-BR');
  }

  abrirModalNovaMeta(): void {
    this.metaSelecionada = null;
    this.readonlyModal = false;
    this.displayModal = true;
  }

  abrirModalEditar(meta: Meta): void {
    this.metaSelecionada = meta;
    this.readonlyModal = false;
    this.displayModal = true;
  }

  abrirModalVisualizar(meta: Meta): void {
    this.metaSelecionada = meta;
    this.readonlyModal = true;
    this.displayModal = true;
  }

  abrirMeta(meta: Meta): void {
    if (this.auth.podeEditarMeta(meta)) {
      this.abrirModalEditar(meta);
      return;
    }

    this.abrirModalVisualizar(meta);
  }

  onMetaCardKeydown(event: KeyboardEvent, meta: Meta): void {
    if (event.key !== 'Enter' && event.key !== ' ') {
      return;
    }

    event.preventDefault();
    this.abrirMeta(meta);
  }

  navegarParaImportacao(): void {
    void this.router.navigate(['/metas/importar']);
  }

  onMetaSalva(metaSalva: Meta): void {
    const metaAtualizada = this.enriquecerMeta(metaSalva);
    const indiceMeta = this.metas.findIndex(({ id }) => id === metaAtualizada.id);

    if (indiceMeta >= 0) {
      this.metas = this.metas.map((meta) => (meta.id === metaAtualizada.id ? metaAtualizada : meta));
    } else {
      this.metas = [...this.metas, metaAtualizada];
    }

    const tituloGrupoAtual = this.obterTituloGrupo(metaAtualizada);
    if (!this.gruposExpandidos.includes(tituloGrupoAtual)) {
      this.gruposExpandidos = [...this.gruposExpandidos, tituloGrupoAtual];
    }

    this.displayModal = false;
    this.metaSelecionada = null;
    this.agruparMetas();
    this.cdr.markForCheck();
  }

  onMetaExcluida(metaId: string): void {
    this.displayModal = false;
    this.metaSelecionada = null;
    this.metas = this.metas.filter((meta) => meta.id !== metaId);
    this.agruparMetas();
    this.cdr.markForCheck();
  }

  getCardStyleClass(status: string | undefined): string {
    switch (this.obterStatusVariant(status)) {
      case 'success':
        return 'meta-card meta-card--success';
      case 'warning':
        return 'meta-card meta-card--warning';
      case 'info':
        return 'meta-card meta-card--info';
      case 'danger':
        return 'meta-card meta-card--danger';
      default:
        return 'meta-card meta-card--neutral';
    }
  }

  getStatusBadgeClass(status: string | undefined): string {
    switch (this.obterStatusVariant(status)) {
      case 'success':
        return 'meta-pill meta-pill--status-success';
      case 'warning':
        return 'meta-pill meta-pill--status-warning';
      case 'info':
        return 'meta-pill meta-pill--status-info';
      case 'danger':
        return 'meta-pill meta-pill--status-danger';
      default:
        return 'meta-pill meta-pill--status-neutral';
    }
  }

  formatStatus(status: string | undefined): string {
    const statusNormalizado = this.normalizarStatus(status);
    return STATUS_LABELS[statusNormalizado] || status?.trim() || 'Pendente';
  }

  exibeSomentePontosAplicaveis(status: string | undefined): boolean {
    const statusNormalizado = this.normalizarStatus(status);
    return statusNormalizado === 'PENDENTE' || statusNormalizado === 'NAO_SE_APLICA';
  }

  exibeMetricasEmAndamento(status: string | undefined): boolean {
    return this.normalizarStatus(status) === 'EM_ANDAMENTO';
  }

  exibePontosAtingidos(status: string | undefined): boolean {
    const statusNormalizado = this.normalizarStatus(status);

    return (
      statusNormalizado === 'PARCIALMENTE_CUMPRIDA' ||
      statusNormalizado === 'TOTALMENTE_CUMPRIDA' ||
      statusNormalizado === 'CONCLUIDA' ||
      statusNormalizado === 'NAO_CUMPRIDA'
    );
  }

  getPontosAtingidos(meta: Meta): number {
    if (this.normalizarStatus(meta.status) === 'NAO_CUMPRIDA') {
      return 0;
    }

    return meta.pontosAtingidos;
  }

  private normalizarStatus(status: string | undefined): string {
    return (status || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .toUpperCase()
      .replace(/\s+/g, '_');
  }

  private obterStatusVariant(status: string | undefined): 'success' | 'warning' | 'info' | 'danger' | 'neutral' {
    switch (this.normalizarStatus(status)) {
      case 'TOTALMENTE_CUMPRIDA':
      case 'CONCLUIDA':
      case 'CONCLUIDO':
        return 'success';
      case 'PENDENTE':
        return 'warning';
      case 'EM_ANDAMENTO':
        return 'info';
      case 'NAO_CUMPRIDA':
        return 'danger';
      default:
        return 'neutral';
    }
  }

  private sincronizarGruposExpandidos(): void {
    const gruposDisponiveis = new Set(this.metasAgrupadas.map(({ tituloGrupo }) => tituloGrupo));
    this.gruposExpandidos = this.gruposExpandidos.filter((tituloGrupo) => gruposDisponiveis.has(tituloGrupo));
  }
}
