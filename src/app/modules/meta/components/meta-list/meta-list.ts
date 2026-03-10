import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Meta } from '../../models/meta.model';
import { MetaService } from '../../services/meta';
import { Auth } from '../../../../core/services/auth';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { AccordionModule } from 'primeng/accordion';
import { SelectButtonModule } from 'primeng/selectbutton';
import { MetaEstruturalModal } from '../meta-estrutural-modal/meta-estrutural-modal';

interface GrupoMeta {
  tituloGrupo: string;
  metas: Meta[];
}

@Component({
  selector: 'app-meta-list',
  imports: [CommonModule, DatePipe, FormsModule, CardModule, MetaEstruturalModal, TagModule, AccordionModule, SelectButtonModule],
  templateUrl: './meta-list.html',
  styleUrl: './meta-list.scss',
})
export class MetaList implements OnInit {

  metas: Meta[] = [];
  metasAgrupadas: GrupoMeta[] = [];
  loading = true;
  error = '';

  // Agrupamento
  agrupamento: 'coordenador' | 'setor' = 'coordenador';
  agrupamentoOptions = [
    { label: 'Por Coordenador', value: 'coordenador' },
    { label: 'Por Setor', value: 'setor' }
  ];

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
    this.metaService.listarTodas().subscribe({
      next: (metas) => {
        // Enriquecer metas com nomes de eixo e setor se não vierem do backend
        this.metas = metas.map(m => ({
            ...m,
            eixoNome: m.eixoNome || this.eixosMap[m.eixoId] || `Eixo ${m.eixoId}`,
            setorNome: m.setorNome || this.setoresMap[m.setorId] || `Setor ${m.setorId}`
        }));
        this.agruparMetas();
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

  onAgrupamentoChange(): void {
    this.agruparMetas();
  }

  agruparMetas(): void {
    const gruposMap = new Map<string, Meta[]>();

    for (const meta of this.metas) {
      let chave = '';
      if (this.agrupamento === 'coordenador') {
        chave = meta.coordenadorNome || 'Sem Coordenador';
      } else {
        chave = meta.setorNome || 'Sem Setor';
      }

      if (!gruposMap.has(chave)) {
        gruposMap.set(chave, []);
      }
      gruposMap.get(chave)!.push(meta);
    }

    // Converter para array e ordenar (Sem Coordenador por último, por exemplo)
    this.metasAgrupadas = Array.from(gruposMap.entries()).map(([titulo, metasGrupo]) => ({
      tituloGrupo: titulo,
      metas: metasGrupo
    })).sort((a, b) => {
      if (a.tituloGrupo === 'Sem Coordenador' || a.tituloGrupo === 'Sem Setor') return 1;
      if (b.tituloGrupo === 'Sem Coordenador' || b.tituloGrupo === 'Sem Setor') return -1;
      return a.tituloGrupo.localeCompare(b.tituloGrupo);
    });
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
