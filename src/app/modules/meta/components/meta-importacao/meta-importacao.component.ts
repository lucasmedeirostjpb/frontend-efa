import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FileUploadModule } from 'primeng/fileupload';
import { TableModule } from 'primeng/table';
import { SelectModule } from 'primeng/select';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { InputTextModule } from 'primeng/inputtext';
import { Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import * as XLSX from 'xlsx';
import { MetaService } from '../../services/meta';
import { Meta } from '../../models/meta.model';

interface ItemMapeamento {
  campo: string;
  label: string;
  colunaPlanilha: string | null;
}

@Component({
  selector: 'app-meta-importacao',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    FileUploadModule,
    TableModule,
    SelectModule,
    CardModule,
    ButtonModule,
    ToastModule,
    InputTextModule,
    TagModule
  ],
  providers: [MessageService],
  templateUrl: './meta-importacao.component.html',
  styleUrl: './meta-importacao.component.scss'
})
export class MetaImportacaoComponent {
  etapa: 'upload' | 'mapeamento' = 'upload';
  colunasPlanilha: string[] = [];
  dadosMapeamento: ItemMapeamento[] = [];
  dadosPlanilhaFull: any[] = [];
  anoCicloGlobal: number = new Date().getFullYear();
  loading = false;
  
  camposSistema = [
    { label: 'Título da Meta', value: 'titulo' },
    { label: 'Descrição', value: 'descricao' },
    { label: 'Eixo Temático', value: 'eixoNome' },
    { label: 'Setor Responsável', value: 'setorNome' },
    { label: 'Artigo', value: 'artigo' },
    { label: 'Prazo (Deadline)', value: 'deadline' },
    { label: 'Pontos Máximos', value: 'pMaximo' },
    { label: 'Observações', value: 'observacoes' }
  ];

  constructor(
    private messageService: MessageService,
    private metaService: MetaService,
    private router: Router
  ) {
    console.log('--- VERSÃO 3 DA IMPORTAÇÃO CARREGADA (SANITIZAÇÃO + FILTRAGEM) ---');
  }

  onUpload(event: any) {
    const file = event.files[0];
    const reader = new FileReader();

    reader.onload = (e: any) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array', cellDates: true });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      
      const jsonData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      if (jsonData && jsonData.length > 0) {
        this.colunasPlanilha = jsonData[0].map(h => String(h)).filter(h => h && h.trim() !== '');
        
        // Armazena todos os dados (exceto cabeçalho)
        // Convertemos para array de objetos usando as colunas originais como chaves
        this.dadosPlanilhaFull = XLSX.utils.sheet_to_json(worksheet);
        
        console.log('Dados extraídos da planilha:', this.dadosPlanilhaFull[0]);
        
        // Inicializa o mapeamento baseado nos campos do sistema
        this.dadosMapeamento = this.camposSistema.map(campo => ({
          campo: campo.value,
          label: campo.label,
          colunaPlanilha: this.tentarAutoMapear(campo.label, this.colunasPlanilha)
        }));
        
        this.etapa = 'mapeamento';
      } else {
        this.messageService.add({ 
          severity: 'error', 
          summary: 'Erro', 
          detail: 'Planilha vazia ou inválida.' 
        });
      }
    };

    reader.readAsArrayBuffer(file);
  }

  private tentarAutoMapear(labelSistema: string, colunas: string[]): string | null {
    const labelLower = labelSistema.toLowerCase();
    return colunas.find(c => {
      const colLower = c.toLowerCase();
      return colLower === labelLower || colLower.includes(labelLower) || labelLower.includes(colLower);
    }) || null;
  }

  voltar() {
    this.etapa = 'upload';
    this.colunasPlanilha = [];
    this.dadosMapeamento = [];
  }

  confirmarImportacao() {
    if (this.dadosPlanilhaFull.length === 0) return;

    // Validação básica: Título, Eixo, Setor, Prazo e Pontos são recomendados
    const obrigatorios = ['titulo', 'eixoNome', 'setorNome', 'deadline', 'pMaximo'];
    const mapeados = this.dadosMapeamento.filter(m => m.colunaPlanilha).map(m => m.campo);
    const faltando = obrigatorios.filter(o => !mapeados.includes(o));

    if (faltando.length > 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Atenção',
        detail: `Campos obrigatórios não mapeados: ${faltando.join(', ')}`
      });
      return;
    }

    this.loading = true;
    const itemsParaCriar: Partial<Meta>[] = [];

    // Processa os dados da planilha de acordo com o mapeamento
    this.dadosPlanilhaFull.forEach((row, index) => {
      // Ignora linhas que não possuem título mapeado (evita erros com linhas vazias no Excel)
      const colunaTitulo = this.dadosMapeamento.find(m => m.campo === 'titulo')?.colunaPlanilha;
      if (colunaTitulo && (!row[colunaTitulo] || String(row[colunaTitulo]).trim() === '')) {
        console.warn(`Pulando linha ${index + 2} por falta de título.`);
        return;
      }

      const meta: any = {
        anoCiclo: this.anoCicloGlobal,
        status: 'PENDENTE',
        nivelDificuldade: 'SEM_DIFICULDADES',
        evidenciasAuditoria: ''
      };

      this.dadosMapeamento.forEach(m => {
        if (m.colunaPlanilha && row[m.colunaPlanilha] !== undefined) {
          let valor = row[m.colunaPlanilha];

          // Sanitização específica por tipo de campo
          if (m.campo === 'deadline') {
            if (valor instanceof Date) {
              valor = valor.toISOString().split('T')[0];
            } else if (typeof valor === 'string' && valor.trim() !== '' && valor.trim() !== '-') {
              // Tenta converter de DD/MM/YYYY para YYYY-MM-DD
              const partes = valor.split('/');
              if (partes.length === 3) {
                valor = `${partes[2].trim()}-${partes[1].trim()}-${partes[0].trim()}`;
              } else {
                valor = null;
              }
            } else {
              valor = null;
            }
          }

          if (m.campo === 'pMaximo' || m.campo === 'estimativaReal' || m.campo === 'tetoEstimado' || m.campo === 'pontosAtingidos') {
            if (typeof valor === 'string') {
                // Remove R$, espaços e troca vírgula por ponto
                valor = valor.replace(/[R$\s]/g, '').replace(',', '.');
            }
            valor = parseFloat(valor);
            if (isNaN(valor)) valor = 0;
          }

          meta[m.campo] = valor;
        }
      });
      // Remove undefined para evitar erros de parsing no backend
      Object.keys(meta).forEach(key => {
        if (meta[key] === undefined) delete meta[key];
      });

      itemsParaCriar.push(meta);
    });

    console.log('--- RESUMO DA CARGA PARA O LOTE ---');
    console.log('Total de registros:', itemsParaCriar.length);
    if (itemsParaCriar.length > 0) {
      console.log('Primeiro item (JSON):', JSON.stringify(itemsParaCriar[0], null, 2));
      
      // Validação rápida no console para ajudar o usuário
      const schemaCheck = itemsParaCriar[0];
      const missing = [];
      if (!schemaCheck.titulo) missing.push('titulo');
      if (!schemaCheck.anoCiclo) missing.push('anoCiclo');
      if (!schemaCheck.deadline) missing.push('deadline');
      if (schemaCheck.status === undefined) missing.push('status');
      if (schemaCheck.pMaximo === undefined) missing.push('pMaximo');
      
      if (missing.length > 0) {
        console.warn('⚠️ CAMPOS OBRIGATÓRIOS AUSENTES NO PRIMEIRO ITEM:', missing);
      }
    }

    this.messageService.add({ 
      severity: 'info', 
      summary: 'Iniciando Importação', 
      detail: `Processando ${itemsParaCriar.length} metas em lote...` 
    });

    console.log('Enviando para o lote (primeiro item):', itemsParaCriar[0]);

    this.metaService.criarEmLote(itemsParaCriar).pipe(
      finalize(() => {
        this.loading = false;
      })
    ).subscribe({
      next: (results) => {
        console.log('Sucesso no lote:', results.length, 'itens criados.');
        this.messageService.add({ 
          severity: 'success', 
          summary: 'Importação Concluída', 
          detail: `${results.length} metas criadas com sucesso.` 
        });
        
        setTimeout(() => {
          this.router.navigate(['/metas']);
        }, 2000);
      },
      error: (err) => {
        console.error('Erro detalhado na importação em lote:', err);
        this.messageService.add({ 
          severity: 'error', 
          summary: 'Erro na Importação', 
          detail: 'Falha ao processar o lote de metas. Verifique o console para detalhes.' 
        });
      }
    });
  }
}
