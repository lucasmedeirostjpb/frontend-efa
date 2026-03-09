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
    ToastModule
  ],
  providers: [MessageService],
  templateUrl: './meta-importacao.component.html',
  styleUrl: './meta-importacao.component.scss'
})
export class MetaImportacaoComponent {
  etapa: 'upload' | 'mapeamento' = 'upload';
  colunasPlanilha: string[] = [];
  dadosMapeamento: ItemMapeamento[] = [];
  
  camposSistema = [
    { label: 'Título da Meta', value: 'titulo' },
    { label: 'Descrição', value: 'descricao' },
    { label: 'Eixo Temático', value: 'eixoNome' },
    { label: 'Setor Responsável', value: 'setorNome' },
    { label: 'Artigo', value: 'artigo' },
    { label: 'Ano do Ciclo', value: 'anoCiclo' },
    { label: 'Prazo (Deadline)', value: 'deadline' },
    { label: 'Pontos Máximos', value: 'pMaximo' },
    { label: 'Nível de Dificuldade', value: 'nivelDificuldade' },
    { label: 'Evidências Auditoria', value: 'evidenciasAuditoria' },
    { label: 'Observações', value: 'observacoes' }
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
      
      const jsonData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      if (jsonData && jsonData.length > 0) {
        this.colunasPlanilha = jsonData[0].map(h => String(h)).filter(h => h && h.trim() !== '');
        
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
    // Retorna o dicionário de mapeamento invertido: Campo Sistema -> Coluna Planilha
    const mapeamento: { [key: string]: string } = {};
    
    this.dadosMapeamento.forEach(item => {
      if (item.colunaPlanilha) {
        mapeamento[item.campo] = item.colunaPlanilha;
      }
    });

    console.log('Mapeamento Final (Sistema -> Planilha):', mapeamento);
    this.messageService.add({ 
      severity: 'success', 
      summary: 'Mapeamento Concluído', 
      detail: 'As colunas foram mapeadas com sucesso.' 
    });
  }
}
