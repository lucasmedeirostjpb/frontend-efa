import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FileUploadModule } from 'primeng/fileupload';
import { TableModule } from 'primeng/table';
import { SelectModule } from 'primeng/select';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import * as XLSX from 'xlsx';

interface ColunaMapeamento {
  planilha: string;
  sistema: string | null;
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
    ToastModule
  ],
  providers: [MessageService],
  templateUrl: './meta-importacao.component.html',
  styleUrl: './meta-importacao.component.scss'
})
export class MetaImportacaoComponent {
  etapa: 'upload' | 'mapeamento' = 'upload';
  colunasPlanilha: string[] = [];
  dadosMapeamento: ColunaMapeamento[] = [];
  
  camposSistema = [
    { label: 'Título da Meta', value: 'titulo' },
    { label: 'Descrição', value: 'descricao' },
    { label: 'ID do Eixo', value: 'eixoId' },
    { label: 'ID do Setor', value: 'setorId' },
    { label: 'Artigo', value: 'artigo' },
    { label: 'Ano do Ciclo', value: 'anoCiclo' },
    { label: 'Prazo (Deadline)', value: 'deadline' },
    { label: 'Pontos Máximos', value: 'pMaximo' }
  ];

  constructor(private messageService: MessageService) {}

  onUpload(event: any) {
    const file = event.files[0];
    const reader = new FileReader();

    reader.onload = (e: any) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      
      // Extrair apenas os cabeçalhos (primeira linha)
      // sheet_to_json com header: 1 retorna um array de arrays (rows)
      const jsonData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      if (jsonData && jsonData.length > 0) {
        this.colunasPlanilha = jsonData[0].map(h => String(h));
        this.dadosMapeamento = this.colunasPlanilha.map(col => ({
          planilha: col,
          sistema: null
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

  voltar() {
    this.etapa = 'upload';
    this.colunasPlanilha = [];
    this.dadosMapeamento = [];
  }

  confirmarImportacao() {
    // Retorna o dicionário de mapeamento conforme solicitado
    const mapeamento: { [key: string]: string } = {};
    
    this.dadosMapeamento.forEach(item => {
      if (item.sistema) {
        mapeamento[item.planilha] = item.sistema;
      }
    });

    console.log('Mapeamento Final:', mapeamento);
    this.messageService.add({ 
      severity: 'success', 
      summary: 'Mapeamento Concluído', 
      detail: 'As colunas foram mapeadas com sucesso.' 
    });
  }
}
