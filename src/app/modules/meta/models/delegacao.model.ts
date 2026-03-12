export interface Delegacao {
  id: number;
  delegadoEmail: string;
  delegadoNome: string;
}

export interface DelegacaoCreatePayload {
  delegadoEmail: string;
  delegadoNome: string;
}