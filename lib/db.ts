import { neon } from '@neondatabase/serverless';
import fs from 'fs';
import path from 'path';

export type Role = 'ADMIN' | 'FUNCIONARIO';

export interface User {
  id: string;
  nome: string;
  email: string;
  matricula: string;
  senhaHash: string;
  role: Role;
  ativo: boolean;
  createdAt: string;
}

export type TipoProduto = 'NOVA' | 'SEMI_NOVA';
export type PoloBateria = 'DIREITO' | 'ESQUERDO';
export type AplicacaoBateria = 'CARRO' | 'MOTO' | 'CAMINHAO' | 'ESTACIONARIA' | 'SOM';
export type TecnologiaBateria = 'SLI' | 'EFB' | 'AGM' | 'GEL';

export interface Product {
  id: string;
  codigoSKU?: string;
  tipo: TipoProduto;
  marca: string;
  modelo: string;
  amperagem: number;
  voltagem: string;
  cca: number;
  polo: PoloBateria;
  aplicacao: AplicacaoBateria;
  tecnologia: TecnologiaBateria;
  saudePct: number;
  garantiaMeses: number;
  precoCusto: number;
  precoVenda: number;
  estoque: number;
  estoqueMinimo: number;
  imagemUrl?: string;
  descricao: string;
  createdAt: string;
}

export type FormaPagamento = 'PIX' | 'CREDITO' | 'DEBITO' | 'DINHEIRO';

export interface SaleItem {
  id: string;
  vendaId: string;
  produtoId: string;
  produtoNome: string;
  produtoTipo: TipoProduto;
  quantidade: number;
  precoUnitario: number;
  subtotal: number;
}

export interface Sale {
  id: string;
  codigoVenda: string;
  usuarioId: string;
  usuarioNome: string;
  clienteNome?: string;
  clienteContato?: string;
  formaPagamento: FormaPagamento;
  subtotal: number;
  desconto: number;
  valorTrocaSucata: number;
  valorInstalacao: number;
  total: number;
  observacao?: string;
  dataVenda: string;
  itens: SaleItem[];
}

export interface AuditLog {
  id: string;
  usuarioId: string;
  usuarioNome: string;
  acao: string;
  detalhes: string;
  dataHora: string;
}

const DB_FILE = path.join(process.cwd(), 'data_store.json');

const dbUrl = process.env.POSTGRES_URL || process.env.DATABASE_URL || "postgresql://neondb_owner:npg_T8YVQ2RhCASz@ep-misty-water-avtveiy9-pooler.c-11.us-east-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require";
const sql = neon(dbUrl);

// CATÁLOGO REAL DA JMIX BATERIAS
const catalogRealRaw = [
  { sku: "63061", modelo: "12MN105", nome: "BATERIA MOURA ESTACIONARIA 105AH TIPO 12MN2000", marca: "MOURA ESTACIONARIA", amperagem: 105, custo: 844.58, venda: 1099.00, aplicacao: "ESTACIONARIA", tech: "SLI", garantia: 24, estoque: 6 },
  { sku: "123048", modelo: "12MN150", nome: "BATERIA MOURA ESTACIONARIA 150AH TIPO 12MN2500", marca: "MOURA ESTACIONARIA", amperagem: 150, custo: 1128.00, venda: 1450.00, aplicacao: "ESTACIONARIA", tech: "SLI", garantia: 24, estoque: 3 },
  { sku: "264144", modelo: "12MN2000", nome: "BATERIA ESTACIONARIA 12MN2000", marca: "MOURA ESTACIONARIA", amperagem: 105, custo: 844.58, venda: 1099.00, aplicacao: "ESTACIONARIA", tech: "SLI", garantia: 24, estoque: 4 },
  { sku: "115494", modelo: "12MN220", nome: "BATERIA MOURA ESTACIONARIA 105AH TIPO 12MN4100", marca: "MOURA ESTACIONARIA", amperagem: 220, custo: 1634.65, venda: 1998.00, aplicacao: "ESTACIONARIA", tech: "SLI", garantia: 24, estoque: 2 },
  { sku: "133800", modelo: "12MN300", nome: "BATERIA ESTACIONARIA 12MN300", marca: "MOURA ESTACIONARIA", amperagem: 30, custo: 371.40, venda: 521.00, aplicacao: "ESTACIONARIA", tech: "SLI", garantia: 24, estoque: 5 },
  { sku: "63299", modelo: "12MN45", nome: "BATERIA MOURA ESTACIONARIA 45AH TIPO 12MN700", marca: "MOURA ESTACIONARIA", amperagem: 45, custo: 371.40, venda: 521.00, aplicacao: "ESTACIONARIA", tech: "SLI", garantia: 24, estoque: 8 },
  { sku: "135497", modelo: "12MVA18", nome: "BATERIA 12MVA-18", marca: "MOURA", amperagem: 18, custo: 268.16, venda: 379.00, aplicacao: "ESTACIONARIA", tech: "SLI", garantia: 12, estoque: 4 },
  { sku: "116453", modelo: "12MVA7", nome: "BATERIA ESTACIONARIA 12MVA-7E", marca: "MOURA ESTACIONARIA", amperagem: 7, custo: 120.86, venda: 219.00, aplicacao: "ESTACIONARIA", tech: "SLI", garantia: 12, estoque: 10 },
  { sku: "63088", modelo: "A50", nome: "BATERIA AMERICA 18 MESES 50Ah TIPO AMR50GD", marca: "AMERICA", amperagem: 50, custo: 315.00, venda: 436.00, aplicacao: "CARRO", tech: "SLI", garantia: 18, estoque: 7 },
  { sku: "63089", modelo: "A60", nome: "BATERIA AMERICA 18 MESES 60Ah TIPO AMR60DD", marca: "AMERICA", amperagem: 60, custo: 331.00, venda: 457.00, aplicacao: "CARRO", tech: "SLI", garantia: 18, estoque: 12 },
  { sku: "63118", modelo: "B100E", nome: "BATERIA BOSCH 15 MESES 100Ah TIPO S5X100E", marca: "BOSCH", amperagem: 100, custo: 518.43, venda: 650.00, aplicacao: "CARRO", tech: "SLI", garantia: 15, estoque: 4 },
  { sku: "110619", modelo: "DF1000", nome: "BATERIA HELIAR ESTACIONARIA 60AH TIPO DF1000", marca: "HELIAR ESTACIONARIA", amperagem: 60, custo: 577.15, venda: 749.00, aplicacao: "ESTACIONARIA", tech: "SLI", garantia: 24, estoque: 5 },
  { sku: "128152", modelo: "DF200", nome: "BATERIA HELIAR ESTACIONARIA 105AH TIPO DF2000", marca: "HELIAR ESTACIONARIA", amperagem: 105, custo: 1020.00, venda: 1290.00, aplicacao: "ESTACIONARIA", tech: "SLI", garantia: 24, estoque: 3 },
  { sku: "81505", modelo: "E42PD HONDA", nome: "BATERIA ELETRAN 12 MESES 42AH TIPO 42PD HONDA", marca: "ELETRAN", amperagem: 42, custo: 215.00, venda: 319.00, aplicacao: "CARRO", tech: "SLI", garantia: 12, estoque: 6 },
  { sku: "81503", modelo: "E47PD", nome: "BATERIA ELETRAN 12 MESES 47AH TIPO 47PD", marca: "ELETRAN", amperagem: 47, custo: 220.00, venda: 329.00, aplicacao: "CARRO", tech: "SLI", garantia: 12, estoque: 8 },
  { sku: "81502", modelo: "E50PD", nome: "BATERIA ELETRAN 12 MESES 50AH TIPO 50PDCA ALTA", marca: "ELETRAN", amperagem: 50, custo: 229.00, venda: 349.00, aplicacao: "CARRO", tech: "SLI", garantia: 12, estoque: 9 },
  { sku: "81504", modelo: "E52PD", nome: "BATERIA ELETRAN 12 MESES 52AH TIPO 52PD HONDA", marca: "ELETRAN", amperagem: 52, custo: 270.00, venda: 389.00, aplicacao: "CARRO", tech: "SLI", garantia: 12, estoque: 5 },
  { sku: "81499", modelo: "E60SS", nome: "BATERIA ELETRAN 18 MESES 60AH TIPO EFB", marca: "ELETRAN", amperagem: 60, custo: 430.00, venda: 589.00, aplicacao: "CARRO", tech: "EFB", garantia: 18, estoque: 4 },
  { sku: "81500", modelo: "E72SS", nome: "BATERIA ELETRAN 18 MESES 72AH TIPO EFB", marca: "ELETRAN", amperagem: 72, custo: 510.00, venda: 699.00, aplicacao: "CARRO", tech: "EFB", garantia: 18, estoque: 3 },
  { sku: "81501", modelo: "E75PD", nome: "BATERIA ELETRAN 12 MESES 75AH TIPO 75PD BAIXA", marca: "ELETRAN", amperagem: 75, custo: 365.00, venda: 499.00, aplicacao: "CARRO", tech: "SLI", garantia: 12, estoque: 5 },
  { sku: "108163", modelo: "E90PD", nome: "BATERIA ELETRAN 12 MESES 90AH TIPO 90PD ALTA", marca: "ELETRAN", amperagem: 90, custo: 428.00, venda: 589.00, aplicacao: "CAMINHAO", tech: "SLI", garantia: 12, estoque: 4 },
  { sku: "63085", modelo: "H100LE", nome: "BATERIA HELIAR 24 MESES 100Ah TIPO H100LE", marca: "HELIAR", amperagem: 100, custo: 863.00, venda: 1049.00, aplicacao: "CAMINHAO", tech: "SLI", garantia: 24, estoque: 4 },
  { sku: "63080", modelo: "H50GD", nome: "BATERIA HELIAR 24 MESES 50Ah TIPO HNP50GD", marca: "HELIAR", amperagem: 50, custo: 439.00, venda: 569.00, aplicacao: "CARRO", tech: "SLI", garantia: 24, estoque: 10 },
  { sku: "63077", modelo: "H50SS", nome: "BATERIA HELIAR EFB START STOP 24 MESES 50Ah TIPO HEFB50GD", marca: "HELIAR EFB", amperagem: 50, custo: 660.00, venda: 819.00, aplicacao: "CARRO", tech: "EFB", garantia: 24, estoque: 3 },
  { sku: "63086", modelo: "H5ah", nome: "BATERIA HELIAR MOTO 5Ah TIPO HTZ6L", marca: "HELIAR MOTO", amperagem: 5, custo: 118.00, venda: 219.00, aplicacao: "MOTO", tech: "AGM", garantia: 12, estoque: 15 },
  { sku: "134476", modelo: "H60AGM", nome: "BATERIA HELIAR AGM START STOP 24 MESES TIPO HAGM60HD", marca: "HELIAR AGM", amperagem: 60, custo: 1385.00, venda: 1597.00, aplicacao: "CARRO", tech: "AGM", garantia: 24, estoque: 2 },
  { sku: "63081", modelo: "H60DD", nome: "BATERIA HELIAR 24 MESES 60Ah TIPO HNP60DD", marca: "HELIAR", amperagem: 60, custo: 490.00, venda: 619.00, aplicacao: "CARRO", tech: "SLI", garantia: 24, estoque: 14 },
  { sku: "63082", modelo: "H60HD", nome: "BATERIA HELIAR 24 MESES 60Ah TIPO HNP60HD", marca: "HELIAR", amperagem: 60, custo: 490.00, venda: 619.00, aplicacao: "CARRO", tech: "SLI", garantia: 24, estoque: 11 },
  { sku: "63078", modelo: "H60SS", nome: "BATERIA HELIAR EFB START STOP 24 MESES 60Ah TIPO HEFB60HD", marca: "HELIAR EFB", amperagem: 60, custo: 735.00, venda: 899.00, aplicacao: "CARRO", tech: "EFB", garantia: 24, estoque: 6 },
  { sku: "127983", modelo: "H65HD", nome: "BATERIA HELIAR 24 MESES 65AH TIPO H65HD", marca: "HELIAR", amperagem: 65, custo: 629.00, venda: 779.00, aplicacao: "CARRO", tech: "SLI", garantia: 24, estoque: 7 },
  { sku: "63087", modelo: "H6ah", nome: "BATERIA HELIAR MOTO 6Ah TIPO HTZ7L", marca: "HELIAR MOTO", amperagem: 6, custo: 126.00, venda: 225.00, aplicacao: "MOTO", tech: "AGM", garantia: 12, estoque: 12 },
  { sku: "63079", modelo: "H72SS", nome: "BATERIA HELIAR EFB START STOP 24 MESES 72Ah TIPO HEFB72PD", marca: "HELIAR EFB", amperagem: 72, custo: 849.00, venda: 1025.00, aplicacao: "CARRO", tech: "EFB", garantia: 24, estoque: 4 },
  { sku: "63083", modelo: "H75PD", nome: "BATERIA HELIAR 24 MESES 75Ah TIPO H75PD", marca: "HELIAR", amperagem: 75, custo: 762.00, venda: 919.00, aplicacao: "CARRO", tech: "SLI", garantia: 24, estoque: 5 },
  { sku: "63084", modelo: "H90LD", nome: "BATERIA HELIAR 24 MESES 90Ah TIPO H90LD", marca: "HELIAR", amperagem: 90, custo: 834.00, venda: 999.00, aplicacao: "CAMINHAO", tech: "SLI", garantia: 24, estoque: 3 },
  { sku: "114870", modelo: "H95MD", nome: "BATERIA HELIAR 18 MESES 95AH TIPO H95MD", marca: "HELIAR", amperagem: 95, custo: 855.00, venda: 1023.00, aplicacao: "CAMINHAO", tech: "SLI", garantia: 18, estoque: 3 },
  { sku: "63126", modelo: "K100", nome: "BATERIA KONDOR 12 MESES 100Ah TIPO F30AGE", marca: "KONDOR", amperagem: 100, custo: 502.08, venda: 659.00, aplicacao: "CAMINHAO", tech: "SLI", garantia: 12, estoque: 6 },
  { sku: "63127", modelo: "K150", nome: "BATERIA KONDOR 12 MESES 150Ah TIPO F21SB", marca: "KONDOR", amperagem: 150, custo: 721.92, venda: 899.00, aplicacao: "CAMINHAO", tech: "SLI", garantia: 12, estoque: 4 },
  { sku: "63129", modelo: "K180D", nome: "BATERIA KONDOR 12 MESES 180Ah TIPO F25DB", marca: "KONDOR", amperagem: 180, custo: 799.68, venda: 979.00, aplicacao: "CAMINHAO", tech: "SLI", garantia: 12, estoque: 2 },
  { sku: "63119", modelo: "K46", nome: "BATERIA KONDOR 12 MESES 46Ah TIPO F45D", marca: "KONDOR", amperagem: 46, custo: 218.88, venda: 335.00, aplicacao: "CARRO", tech: "SLI", garantia: 12, estoque: 9 },
  { sku: "63120", modelo: "K50D", nome: "BATERIA KONDOR 12 MESES 50Ah TIPO F50AD", marca: "KONDOR", amperagem: 50, custo: 254.40, venda: 374.00, aplicacao: "CARRO", tech: "SLI", garantia: 12, estoque: 11 },
  { sku: "63122", modelo: "K60AD", nome: "BATERIA KONDOR 12 MESES 60Ah TIPO F22AD", marca: "KONDOR", amperagem: 60, custo: 268.80, venda: 389.00, aplicacao: "CARRO", tech: "SLI", garantia: 12, estoque: 18 },
  { sku: "63130", modelo: "K60SS", nome: "BATERIA KONDOR EFB START STOP 24 MESES 60Ah TIPO EFB22AD", marca: "KONDOR EFB", amperagem: 60, custo: 441.60, venda: 596.00, aplicacao: "CARRO", tech: "EFB", garantia: 24, estoque: 5 },
  { sku: "63131", modelo: "K72SS", nome: "BATERIA KONDOR EFB START STOP 24 MESES 72Ah TIPO EFB28AD", marca: "KONDOR EFB", amperagem: 72, custo: 616.32, venda: 785.00, aplicacao: "CARRO", tech: "EFB", garantia: 24, estoque: 4 },
  { sku: "63123", modelo: "K75", nome: "BATERIA KONDOR 12 MESES 75Ah TIPO F75AD", marca: "KONDOR", amperagem: 75, custo: 408.96, venda: 539.00, aplicacao: "CARRO", tech: "SLI", garantia: 12, estoque: 7 },
  { sku: "63124", modelo: "K90", nome: "BATERIA KONDOR 12 MESES 90Ah TIPO F26HD", marca: "KONDOR", amperagem: 90, custo: 457.92, venda: 594.00, aplicacao: "CAMINHAO", tech: "SLI", garantia: 12, estoque: 5 },
  { sku: "63044", modelo: "M100HE", nome: "BATERIA MOURA 15 MESES 100Ah TIPO M100HE", marca: "MOURA", amperagem: 100, custo: 718.28, venda: 886.00, aplicacao: "CAMINHAO", tech: "SLI", garantia: 15, estoque: 8 },
  { sku: "63045", modelo: "M100QD", nome: "BATERIA MOURA 15 MESES 100Ah TIPO M100QD", marca: "MOURA", amperagem: 100, custo: 737.33, venda: 897.00, aplicacao: "CAMINHAO", tech: "SLI", garantia: 15, estoque: 6 },
  { sku: "63046", modelo: "M135BD", nome: "BATERIA MOURA 15 MESES 135Ah TIPO M135BD", marca: "MOURA", amperagem: 135, custo: 841.45, venda: 1020.00, aplicacao: "CAMINHAO", tech: "SLI", garantia: 15, estoque: 4 },
  { sku: "63047", modelo: "M150BD", nome: "BATERIA MOURA 15 MESES 150Ah TIPO M150BD", marca: "MOURA", amperagem: 150, custo: 954.62, venda: 1093.00, aplicacao: "CAMINHAO", tech: "SLI", garantia: 15, estoque: 5 },
  { sku: "63048", modelo: "M180BD", nome: "BATERIA MOURA 15 MESES 180Ah TIPO M180BD", marca: "MOURA", amperagem: 180, custo: 1008.51, venda: 1205.00, aplicacao: "CAMINHAO", tech: "SLI", garantia: 15, estoque: 3 },
  { sku: "63050", modelo: "M200PD", nome: "BATERIA MOURA 15 MESES 220Ah TIPO M220PD", marca: "MOURA", amperagem: 220, custo: 1433.28, venda: 1590.00, aplicacao: "CAMINHAO", tech: "SLI", garantia: 15, estoque: 2 },
  { sku: "63029", modelo: "M40FD", nome: "BATERIA MOURA 18 MESES 40Ah TIPO M40FD", marca: "MOURA", amperagem: 40, custo: 334.12, venda: 450.00, aplicacao: "CARRO", tech: "SLI", garantia: 18, estoque: 10 },
  { sku: "63030", modelo: "M40SD", nome: "BATERIA MOURA 18 MESES 40Ah TIPO M40SD", marca: "MOURA", amperagem: 40, custo: 353.02, venda: 470.00, aplicacao: "CARRO", tech: "SLI", garantia: 18, estoque: 8 },
  { sku: "63031", modelo: "M48FD", nome: "BATERIA MOURA 18 MESES 48Ah TIPO M48FD", marca: "MOURA", amperagem: 48, custo: 387.85, venda: 509.00, aplicacao: "CARRO", tech: "SLI", garantia: 18, estoque: 9 },
  { sku: "63032", modelo: "M50ED", nome: "BATERIA MOURA 18 MESES 50Ah TIPO M50ED", marca: "MOURA", amperagem: 50, custo: 340.80, venda: 514.00, aplicacao: "CARRO", tech: "SLI", garantia: 18, estoque: 12 },
  { sku: "63033", modelo: "M50JD", nome: "BATERIA MOURA 18 MESES 50Ah TIPO M50JD", marca: "MOURA", amperagem: 50, custo: 414.42, venda: 538.00, aplicacao: "CARRO", tech: "SLI", garantia: 18, estoque: 7 },
  { sku: "63037", modelo: "M60AD", nome: "BATERIA MOURA 18 MESES 60Ah TIPO M60AD", marca: "MOURA", amperagem: 60, custo: 420.94, venda: 529.00, aplicacao: "CARRO", tech: "SLI", garantia: 18, estoque: 1 },
  { sku: "63035", modelo: "M60GD", nome: "BATERIA MOURA 18 MESES 60Ah TIPO M60GD", marca: "MOURA", amperagem: 60, custo: 420.94, venda: 529.00, aplicacao: "CARRO", tech: "SLI", garantia: 18, estoque: 15 },
  { sku: "63038", modelo: "M70KD", nome: "BATERIA MOURA 18 MESES 70Ah TIPO M70KD", marca: "MOURA", amperagem: 70, custo: 558.15, venda: 693.00, aplicacao: "CARRO", tech: "SLI", garantia: 18, estoque: 10 },
  { sku: "63040", modelo: "M75LD", nome: "BATERIA MOURA 18 MESES 75Ah TIPO M75LD", marca: "MOURA", amperagem: 75, custo: 581.49, venda: 749.00, aplicacao: "CARRO", tech: "SLI", garantia: 18, estoque: 8 },
  { sku: "63042", modelo: "M80CD", nome: "BATERIA MOURA 15 MESES 80Ah TIPO M80CD", marca: "MOURA", amperagem: 80, custo: 689.73, venda: 836.00, aplicacao: "CARRO", tech: "SLI", garantia: 15, estoque: 5 },
  { sku: "63043", modelo: "M90TD", nome: "BATERIA MOURA 15 MESES 90Ah TIPO M90TD", marca: "MOURA", amperagem: 90, custo: 716.03, venda: 874.00, aplicacao: "CAMINHAO", tech: "SLI", garantia: 15, estoque: 4 },
  { sku: "63060", modelo: "MA105DD", nome: "BATERIA MOURA AGM START STOP 24 MESES TIPO MA105DD", marca: "MOURA AGM", amperagem: 105, custo: 2304.18, venda: 2612.00, aplicacao: "CARRO", tech: "AGM", garantia: 24, estoque: 2 },
  { sku: "63062", modelo: "MA5", nome: "BATERIA MOURA MOTO 5Ah TIPO MA5", marca: "MOURA MOTO", amperagem: 5, custo: 104.90, venda: 209.00, aplicacao: "MOTO", tech: "AGM", garantia: 12, estoque: 20 },
  { sku: "63063", modelo: "MA6", nome: "BATERIA MOURA MOTO 6Ah TIPO MA6", marca: "MOURA MOTO", amperagem: 6, custo: 123.85, venda: 223.00, aplicacao: "MOTO", tech: "AGM", garantia: 12, estoque: 18 },
  { sku: "63056", modelo: "MA60AD", nome: "BATERIA MOURA AGM START STOP 24 MESES TIPO MA60AD", marca: "MOURA AGM", amperagem: 60, custo: 1265.49, venda: 1399.00, aplicacao: "CARRO", tech: "AGM", garantia: 24, estoque: 3 },
  { sku: "63058", modelo: "MA80CD", nome: "BATERIA MOURA AGM START STOP 24 MESES TIPO MA80CD", marca: "MOURA AGM", amperagem: 80, custo: 1880.16, venda: 2153.00, aplicacao: "CARRO", tech: "AGM", garantia: 24, estoque: 2 },
  { sku: "63059", modelo: "MA92QD", nome: "BATERIA MOURA AGM START STOP 24 MESES TIPO MA92QD", marca: "MOURA AGM", amperagem: 92, custo: 1982.14, venda: 2263.00, aplicacao: "CARRO", tech: "AGM", garantia: 24, estoque: 2 },
  { sku: "63052", modelo: "MF50ED", nome: "BATERIA MOURA EFB START STOP 24 MESES TIPO MF50ED", marca: "MOURA EFB", amperagem: 50, custo: 604.22, venda: 753.00, aplicacao: "CARRO", tech: "EFB", garantia: 24, estoque: 6 },
  { sku: "63053", modelo: "MF60AD", nome: "BATERIA MOURA EFB START STOP 24 MESES TIPO MF60AD", marca: "MOURA EFB", amperagem: 60, custo: 703.83, venda: 860.00, aplicacao: "CARRO", tech: "EFB", garantia: 24, estoque: 8 },
  { sku: "63054", modelo: "MF72LD", nome: "BATERIA MOURA EFB START STOP 24 MESES TIPO MF72LD", marca: "MOURA EFB", amperagem: 72, custo: 845.15, venda: 1014.00, aplicacao: "CARRO", tech: "EFB", garantia: 24, estoque: 4 },
  { sku: "63055", modelo: "MF80", nome: "BATERIA MOURA EFB START STOP 24 MESES TIPO MF80", marca: "MOURA EFB", amperagem: 80, custo: 1020.00, venda: 1145.00, aplicacao: "CARRO", tech: "EFB", garantia: 24, estoque: 3 },
  { sku: "63114", modelo: "On60", nome: "BATERIA ONBAT 12 MESES 60Ah TIPO F 60DN", marca: "ONBAT", amperagem: 60, custo: 223.69, venda: 339.00, aplicacao: "CARRO", tech: "SLI", garantia: 12, estoque: 15 },
  { sku: "63096", modelo: "P60AD", nome: "BATERIA PIONEIRO 18 MESES 60Ah TIPO F60AD", marca: "PIONEIRO", amperagem: 60, custo: 254.88, venda: 379.00, aplicacao: "CARRO", tech: "SLI", garantia: 18, estoque: 16 },
  { sku: "63106", modelo: "P60SS", nome: "BATERIA PIONEIRO EFB START STOP 24 MESES 60Ah TIPO EFB60D", marca: "PIONEIRO EFB", amperagem: 60, custo: 427.02, venda: 563.00, aplicacao: "CARRO", tech: "EFB", garantia: 24, estoque: 5 },
  { sku: "63071", modelo: "Z60", nome: "BATERIA ZETTA 12 MESES 60Ah TIPO Z60", marca: "ZETTA", amperagem: 60, custo: 351.80, venda: 439.00, aplicacao: "CARRO", tech: "SLI", garantia: 12, estoque: 14 },
  { sku: "63072", modelo: "Z70", nome: "BATERIA ZETTA 12 MESES 70Ah TIPO Z70D", marca: "ZETTA", amperagem: 70, custo: 550.18, venda: 645.00, aplicacao: "CARRO", tech: "SLI", garantia: 12, estoque: 9 }
];

const parsedProducts: Product[] = catalogRealRaw.map((item, index) => ({
  id: `prod-${item.sku}-${index}`,
  codigoSKU: item.sku,
  tipo: 'NOVA',
  marca: item.marca,
  modelo: item.modelo,
  amperagem: item.amperagem,
  voltagem: '12V',
  cca: item.amperagem > 100 ? 800 : item.amperagem >= 60 ? 460 : 250,
  polo: 'DIREITO',
  aplicacao: item.aplicacao as AplicacaoBateria,
  tecnologia: item.tech as TecnologiaBateria,
  saudePct: 100,
  garantiaMeses: item.garantia,
  precoCusto: item.custo,
  precoVenda: item.venda,
  estoque: item.estoque,
  estoqueMinimo: 2,
  descricao: item.nome,
  createdAt: new Date().toISOString()
}));

const semiNovasExemplo: Product[] = [
  {
    id: 'prod-semi-moura-60',
    codigoSKU: 'SEMI-001',
    tipo: 'SEMI_NOVA',
    marca: 'MOURA (Semi-nova)',
    modelo: 'M60AD-R',
    amperagem: 60,
    voltagem: '12V',
    cca: 390,
    polo: 'DIREITO',
    aplicacao: 'CARRO',
    tecnologia: 'SLI',
    saudePct: 88,
    garantiaMeses: 3,
    precoCusto: 90.00,
    precoVenda: 220.00,
    estoque: 5,
    estoqueMinimo: 1,
    descricao: 'Bateria Moura 60Ah recondicionada testada em analisador digital com 3 meses de garantia.',
    createdAt: new Date().toISOString()
  },
  {
    id: 'prod-semi-heliar-50',
    codigoSKU: 'SEMI-002',
    tipo: 'SEMI_NOVA',
    marca: 'HELIAR (Semi-nova)',
    modelo: 'H50GD-R',
    amperagem: 50,
    voltagem: '12V',
    cca: 340,
    polo: 'DIREITO',
    aplicacao: 'CARRO',
    tecnologia: 'SLI',
    saudePct: 85,
    garantiaMeses: 3,
    precoCusto: 80.00,
    precoVenda: 190.00,
    estoque: 3,
    estoqueMinimo: 1,
    descricao: 'Bateria Heliar 50Ah seminova em excelente estado com garantia de balcão.',
    createdAt: new Date().toISOString()
  }
];

const allProducts = [...parsedProducts, ...semiNovasExemplo];

const defaultUsers: User[] = [
  {
    id: 'usr-admin-1',
    nome: 'Gerente JMix',
    email: 'admin@jmixbaterias.com.br',
    matricula: 'ADM001',
    senhaHash: '$2a$10$fV3GjI4yC8r3i1j3K2/Z2.3K2L.g1tKxG3yZ7fA1uE9/S7.h0O.6',
    role: 'ADMIN',
    ativo: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'usr-func-1',
    nome: 'Carlos Eduardo (Balcão)',
    email: 'carlos@jmixbaterias.com.br',
    matricula: 'FUN001',
    senhaHash: '$2a$10$fV3GjI4yC8r3i1j3K2/Z2.3K2L.g1tKxG3yZ7fA1uE9/S7.h0O.6',
    role: 'FUNCIONARIO',
    ativo: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'usr-func-2',
    nome: 'Mariana Silva (Vendedor)',
    email: 'mariana@jmixbaterias.com.br',
    matricula: 'FUN002',
    senhaHash: '$2a$10$fV3GjI4yC8r3i1j3K2/Z2.3K2L.g1tKxG3yZ7fA1uE9/S7.h0O.6',
    role: 'FUNCIONARIO',
    ativo: true,
    createdAt: new Date().toISOString()
  }
];

const defaultSales: Sale[] = [
  {
    id: 'vnd-001',
    codigoVenda: '#VND-2026-001',
    usuarioId: 'usr-func-1',
    usuarioNome: 'Carlos Eduardo (Balcão)',
    clienteNome: 'João Pedro de Oliveira',
    clienteContato: '(11) 98765-4321',
    formaPagamento: 'PIX',
    subtotal: 529.00,
    desconto: 20.00,
    valorTrocaSucata: 50.00,
    valorInstalacao: 30.00,
    total: 489.00,
    observacao: 'Cliente entregou bateria velha na troca + instalação no local.',
    dataVenda: new Date(Date.now() - 3600000 * 2).toISOString(),
    itens: [
      {
        id: 'item-1',
        vendaId: 'vnd-001',
        produtoId: 'prod-63037-55',
        produtoNome: 'MOURA M60AD (60Ah 12V)',
        produtoTipo: 'NOVA',
        quantidade: 1,
        precoUnitario: 529.00,
        subtotal: 529.00
      }
    ]
  }
];

const defaultAuditLogs: AuditLog[] = [
  {
    id: 'log-1',
    usuarioId: 'usr-admin-1',
    usuarioNome: 'Gerente JMix',
    acao: 'CATALOGO_NEON_IMPORTADO',
    detalhes: 'Catálogo de 70+ produtos importado da planilha oficial diretamente no Neon Postgres.',
    dataHora: new Date().toISOString()
  }
];

// CRIAÇÃO E POVOAMENTO AUTOMÁTICO DO BANCO NEON POSTGRES NA VERCEL
let isNeonInitialized = false;

async function initNeonTables() {
  if (isNeonInitialized) return;
  try {
    // Criar tabela se não existir
    await sql`
      CREATE TABLE IF NOT EXISTS products (
        id VARCHAR(255) PRIMARY KEY,
        sku VARCHAR(255),
        tipo VARCHAR(50),
        marca VARCHAR(255),
        modelo VARCHAR(255),
        amperagem NUMERIC,
        voltagem VARCHAR(50),
        cca NUMERIC,
        polo VARCHAR(50),
        aplicacao VARCHAR(100),
        tecnologia VARCHAR(50),
        saude_pct NUMERIC,
        garantia_meses NUMERIC,
        preco_custo NUMERIC,
        preco_venda NUMERIC,
        estoque NUMERIC,
        estoque_minimo NUMERIC,
        descricao TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    const countRes = await sql`SELECT COUNT(*) as count FROM products`;
    if (countRes && Number(countRes[0].count) === 0) {
      console.log('Populando tabela products do Neon DB com os 70+ produtos...');
      for (const p of allProducts) {
        await sql`
          INSERT INTO products (
            id, sku, tipo, marca, modelo, amperagem, voltagem, cca, polo, aplicacao, tecnologia, saude_pct, garantia_meses, preco_custo, preco_venda, estoque, estoque_minimo, descricao, created_at
          ) VALUES (
            ${p.id}, ${p.codigoSKU || ''}, ${p.tipo}, ${p.marca}, ${p.modelo}, ${p.amperagem}, ${p.voltagem}, ${p.cca}, ${p.polo}, ${p.aplicacao}, ${p.tecnologia}, ${p.saudePct}, ${p.garantiaMeses}, ${p.precoCusto}, ${p.precoVenda}, ${p.estoque}, ${p.estoqueMinimo}, ${p.descricao}, ${p.createdAt}
          ) ON CONFLICT (id) DO NOTHING;
        `;
      }
    }
    isNeonInitialized = true;
  } catch (err) {
    console.error('Inicialização do Neon DB:', err);
  }
}

function loadLocalData() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      const data = JSON.parse(raw);

      if (data.users && Array.isArray(data.users)) {
        const adminIdx = data.users.findIndex((u: any) => u.email.toLowerCase() === 'admin@jmixbaterias.com.br');
        if (adminIdx > -1) {
          data.users[adminIdx].role = 'ADMIN';
        } else {
          data.users.unshift(defaultUsers[0]);
        }
      }

      return {
        users: data.users || defaultUsers,
        products: data.products && data.products.length > 0 ? data.products : allProducts,
        sales: data.sales || defaultSales,
        auditLogs: data.auditLogs || defaultAuditLogs
      };
    }
  } catch (err) {}

  const initialData = {
    users: defaultUsers,
    products: allProducts,
    sales: defaultSales,
    auditLogs: defaultAuditLogs
  };

  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
  } catch (err) {}

  return initialData;
}

function saveLocalData(data: any) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {}
}

export const db = {
  // PRODUTOS
  async getProducts(tipo?: TipoProduto): Promise<Product[]> {
    try {
      await initNeonTables();
      const res = await sql`SELECT * FROM products ORDER BY created_at DESC`;
      if (res && res.length > 0) {
        const prods: Product[] = res.map((r: any) => ({
          id: r.id,
          codigoSKU: r.sku,
          tipo: r.tipo,
          marca: r.marca,
          modelo: r.modelo,
          amperagem: Number(r.amperagem),
          voltagem: r.voltagem,
          cca: Number(r.cca),
          polo: r.polo,
          aplicacao: r.aplicacao,
          tecnologia: r.tecnologia,
          saudePct: Number(r.saude_pct),
          garantiaMeses: Number(r.garantia_meses),
          precoCusto: Number(r.preco_custo),
          precoVenda: Number(r.preco_venda),
          estoque: Number(r.estoque),
          estoqueMinimo: Number(r.estoque_minimo),
          descricao: r.descricao || '',
          createdAt: r.created_at
        }));
        if (!tipo) return prods;
        return prods.filter((p: Product) => p.tipo === tipo);
      }
    } catch (err) {}

    const data = loadLocalData();
    if (!tipo) return data.products;
    return data.products.filter((p: Product) => p.tipo === tipo);
  },

  async getProductById(id: string): Promise<Product | null> {
    const prods = await this.getProducts();
    return prods.find((p: Product) => p.id === id) || null;
  },

  async saveProduct(product: Omit<Product, 'id' | 'createdAt'>): Promise<Product> {
    const newProduct: Product = {
      ...product,
      id: 'prod-' + Date.now(),
      createdAt: new Date().toISOString()
    };

    try {
      await initNeonTables();
      await sql`
        INSERT INTO products (
          id, sku, tipo, marca, modelo, amperagem, voltagem, cca, polo, aplicacao, tecnologia, saude_pct, garantia_meses, preco_custo, preco_venda, estoque, estoque_minimo, descricao, created_at
        ) VALUES (
          ${newProduct.id}, ${newProduct.codigoSKU || ''}, ${newProduct.tipo}, ${newProduct.marca}, ${newProduct.modelo}, ${newProduct.amperagem}, ${newProduct.voltagem}, ${newProduct.cca}, ${newProduct.polo}, ${newProduct.aplicacao}, ${newProduct.tecnologia}, ${newProduct.saudePct}, ${newProduct.garantiaMeses}, ${newProduct.precoCusto}, ${newProduct.precoVenda}, ${newProduct.estoque}, ${newProduct.estoqueMinimo}, ${newProduct.descricao}, ${newProduct.createdAt}
        );
      `;
    } catch (err) {}

    const data = loadLocalData();
    data.products.unshift(newProduct);
    saveLocalData(data);
    return newProduct;
  },

  async updateProduct(id: string, product: Partial<Product>): Promise<Product | null> {
    const data = loadLocalData();
    const idx = data.products.findIndex((p: Product) => p.id === id);
    if (idx !== -1) {
      data.products[idx] = {
        ...data.products[idx],
        ...product
      };
      saveLocalData(data);
    }

    try {
      if (product.estoque !== undefined) {
        await sql`UPDATE products SET estoque = ${product.estoque} WHERE id = ${id}`;
      }
    } catch (err) {}

    return data.products[idx] || null;
  },

  async deleteProduct(id: string): Promise<boolean> {
    try {
      await sql`DELETE FROM products WHERE id = ${id}`;
    } catch (err) {}

    const data = loadLocalData();
    const initialLen = data.products.length;
    data.products = data.products.filter((p: Product) => p.id !== id);
    if (data.products.length < initialLen) {
      saveLocalData(data);
      return true;
    }
    return false;
  },

  // VENDAS
  async getSales(): Promise<Sale[]> {
    const data = loadLocalData();
    return data.sales;
  },

  async createSale(salePayload: {
    usuarioId: string;
    usuarioNome: string;
    clienteNome?: string;
    clienteContato?: string;
    formaPagamento: FormaPagamento;
    desconto: number;
    valorTrocaSucata: number;
    valorInstalacao?: number;
    observacao?: string;
    itens: { produtoId: string; quantidade: number }[];
  }): Promise<Sale> {
    const data = loadLocalData();

    let subtotal = 0;
    const saleItems: SaleItem[] = [];

    for (const item of salePayload.itens) {
      const prodIdx = data.products.findIndex((p: Product) => p.id === item.produtoId);
      if (prodIdx === -1) {
        throw new Error(`Produto ID ${item.produtoId} não encontrado.`);
      }

      const product = data.products[prodIdx];
      if (product.estoque < item.quantidade) {
        throw new Error(`Estoque insuficiente para a bateria "${product.marca} ${product.modelo}". Disponível: ${product.estoque}, Solicitado: ${item.quantidade}`);
      }

      data.products[prodIdx].estoque -= item.quantidade;
      
      // Atualizar também no Neon Postgres
      try {
        await sql`UPDATE products SET estoque = ${data.products[prodIdx].estoque} WHERE id = ${product.id}`;
      } catch (err) {}

      const itemSubtotal = product.precoVenda * item.quantidade;
      subtotal += itemSubtotal;

      saleItems.push({
        id: 'item-' + Math.random().toString(36).substring(2, 9),
        vendaId: '',
        produtoId: product.id,
        produtoNome: `${product.marca} ${product.modelo} (${product.amperagem}Ah ${product.voltagem})`,
        produtoTipo: product.tipo,
        quantidade: item.quantidade,
        precoUnitario: product.precoVenda,
        subtotal: itemSubtotal
      });
    }

    const valorInstalacao = salePayload.valorInstalacao || 0;
    const total = Math.max(0, subtotal + valorInstalacao - salePayload.desconto - salePayload.valorTrocaSucata);
    const saleId = 'vnd-' + Date.now();
    const codigoVenda = `#VND-${new Date().getFullYear()}-${String(data.sales.length + 1).padStart(3, '0')}`;

    saleItems.forEach(i => i.vendaId = saleId);

    const newSale: Sale = {
      id: saleId,
      codigoVenda,
      usuarioId: salePayload.usuarioId,
      usuarioNome: salePayload.usuarioNome,
      clienteNome: salePayload.clienteNome || 'Cliente de Balcão',
      clienteContato: salePayload.clienteContato,
      formaPagamento: salePayload.formaPagamento,
      subtotal,
      desconto: salePayload.desconto,
      valorTrocaSucata: salePayload.valorTrocaSucata,
      valorInstalacao,
      total,
      observacao: salePayload.observacao,
      dataVenda: new Date().toISOString(),
      itens: saleItems
    };

    data.sales.unshift(newSale);

    const detalhesInstalacao = valorInstalacao > 0 ? ` (Instalação: R$ ${valorInstalacao.toFixed(2)})` : '';
    data.auditLogs.unshift({
      id: 'log-' + Date.now(),
      usuarioId: salePayload.usuarioId,
      usuarioNome: salePayload.usuarioNome,
      acao: 'VENDA_REGISTRADA',
      detalhes: `Venda ${codigoVenda} registrada no valor de R$ ${total.toFixed(2)} (${salePayload.formaPagamento})${detalhesInstalacao} por ${salePayload.usuarioNome}.`,
      dataHora: new Date().toISOString()
    });

    saveLocalData(data);
    return newSale;
  },

  // USUÁRIOS
  async getUsers(): Promise<User[]> {
    const data = loadLocalData();
    return data.users;
  },

  async getUserByEmail(email: string): Promise<User | null> {
    const data = loadLocalData();
    return data.users.find((u: User) => u.email.toLowerCase() === email.toLowerCase()) || null;
  },

  async createUser(user: Omit<User, 'id' | 'createdAt'>): Promise<User> {
    const data = loadLocalData();
    const newUser: User = {
      ...user,
      id: 'usr-' + Date.now(),
      createdAt: new Date().toISOString()
    };
    data.users.push(newUser);
    saveLocalData(data);
    return newUser;
  },

  async updateUser(id: string, user: Partial<User>): Promise<User | null> {
    const data = loadLocalData();
    const idx = data.users.findIndex((u: User) => u.id === id);
    if (idx === -1) return null;

    data.users[idx] = {
      ...data.users[idx],
      ...user
    };
    saveLocalData(data);
    return data.users[idx];
  },

  async deleteUser(id: string): Promise<boolean> {
    const data = loadLocalData();
    const initialLen = data.users.length;
    data.users = data.users.filter((u: User) => u.id !== id);
    if (data.users.length < initialLen) {
      saveLocalData(data);
      return true;
    }
    return false;
  },

  // LOGS
  async getAuditLogs(): Promise<AuditLog[]> {
    const data = loadLocalData();
    return data.auditLogs;
  },

  async addAuditLog(usuarioId: string, usuarioNome: string, acao: string, detalhes: string): Promise<AuditLog> {
    const data = loadLocalData();
    const log: AuditLog = {
      id: 'log-' + Date.now(),
      usuarioId,
      usuarioNome,
      acao,
      detalhes,
      dataHora: new Date().toISOString()
    };
    data.auditLogs.unshift(log);
    saveLocalData(data);
    return log;
  }
};
