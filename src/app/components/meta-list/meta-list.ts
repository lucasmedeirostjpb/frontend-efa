import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { Meta } from '../../models/meta.model';
import { MetaService } from '../../services/meta';
import { Auth } from '../../services/auth';

@Component({
  selector: 'app-meta-list',
  imports: [RouterLink, DatePipe],
  templateUrl: './meta-list.html',
  styleUrl: './meta-list.css',
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
        this.metas = page.content;
        this.currentPage = page.number;
        this.totalPages = page.totalPages;
        this.totalElements = page.totalElements;
        this.isFirst = page.first;
        this.isLast = page.last;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
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
      error: (err) => {
        console.error('Erro ao excluir meta', err);
        this.error = 'Não foi possível excluir a meta. Verifique suas permissões.';
        this.cdr.detectChanges();
      },
    });
  }
}
