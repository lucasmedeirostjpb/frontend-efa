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
    this.metaService.listar().subscribe({
      next: (metas) => {
        this.metas = metas;
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
}
