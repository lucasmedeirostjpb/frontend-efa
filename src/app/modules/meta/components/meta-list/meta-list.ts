import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Meta } from '../../models/meta.model';
import { MetaService } from '../../services/meta';
import { Auth } from '../../../../core/services/auth';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { MetaEstruturalModal } from '../meta-estrutural-modal/meta-estrutural-modal';

@Component({
  selector: 'app-meta-list',
  imports: [CommonModule, DatePipe, CardModule, MetaEstruturalModal, TagModule],
  templateUrl: './meta-list.html',
  styleUrl: './meta-list.scss',
})
export class MetaList implements OnInit {

  metas: Meta[] = [];
  loading = true;
  error = '';

  // Paginação
  currentPage = 0;
  totalPages = 0;
  totalElements = 0;
  pageSize = 10;
  isFirst = true;
  isLast = true;

  // Modal Controle
  displayModal = false;
  metaSelecionada: Meta | null = null;
  readonlyModal = false;

  // Mock dados para exibir nomes
  private eixosMap: { [key: number]: string } = {
    1: 'Produtividade',
    2: 'Celeridade',
    3: 'Inovação e Qualidade',
    4: 'Sustentabilidade'
  };

  private setoresMap: { [key: number]: string } = {
    1: 'Gabinete',
    2: 'Tecnologia da Informação',
    3: 'Gestão de Pessoas',
    4: 'Administrativo'
  };

  constructor(
    private metaService: MetaService,
    private cdr: ChangeDetectorRef,
    public auth: Auth
  ) { }

  ngOnInit(): void {
    this.carregarMetas();
  }

  carregarMetas(): void {
    this.loading = true;
    this.error = '';
    this.metaService.listar(this.currentPage, this.pageSize).subscribe({
      next: (page) => {
        // Enriquecer metas com nomes de eixo e setor se não vierem do backend
        this.metas = page.content.map(m => ({
            ...m,
            eixoNome: m.eixoNome || this.eixosMap[m.eixoId] || `Eixo ${m.eixoId}`,
            setorNome: m.setorNome || this.setoresMap[m.setorId] || `Setor ${m.setorId}`
        }));
        this.currentPage = page.number;
        this.totalPages = page.totalPages;
        this.totalElements = page.totalElements;
        this.isFirst = page.first;
        this.isLast = page.last;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('Erro ao carregar metas', err);
        this.error = 'Não foi possível carregar as metas. Tente novamente.';
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  paginaAnterior(): void {
    if (!this.isFirst) {
      this.currentPage--;
      this.carregarMetas();
    }
  }

  proximaPagina(): void {
    if (!this.isLast) {
      this.currentPage++;
      this.carregarMetas();
    }
  }

  deletarMeta(meta: Meta): void {
    const confirmado = window.confirm(`Deseja realmente excluir a meta "${meta.titulo}"?`);
    if (!confirmado) return;

    this.metaService.deletar(meta.id).subscribe({
      next: () => {
        this.carregarMetas();
      },
      error: (err: any) => {
        console.error('Erro ao excluir meta', err);
        this.error = 'Não foi possível excluir a meta. Verifique suas permissões.';
        this.cdr.detectChanges();
      },
    });
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

  onMetaSalva(): void {
    this.displayModal = false;
    this.carregarMetas();
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

  formatStatus(status: string | undefined): string {
    const s = (status || '').toUpperCase();
    const map: { [key: string]: string } = {
      'PENDENTE': 'Pendente',
      'EM_ANDAMENTO': 'Em Andamento',
      'EM ANDAMENTO': 'Em Andamento',
      'PARCIALMENTE_CUMPRIDA': 'Parcialmente Cumprida',
      'TOTALMENTE_CUMPRIDA': 'Totalmente Cumprida',
      'NAO_CUMPRIDA': 'Não Cumprida',
      'NAO_SE_APLICA': 'Não se Aplica',
      'CONCLUÍDA': 'Concluída'
    };
    return map[s] || s || 'Pendente';
  }
}
