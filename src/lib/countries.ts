export interface DocumentType {
  id: string;
  name: string;
  placeholder: string;
  description?: string;
}

export interface CountryInfo {
  code: string;
  name: string;
  flag: string;
  defaultCurrency: string;
  documents: DocumentType[];
}

export const COUNTRIES: CountryInfo[] = [
  {
    code: 'BR',
    name: 'Brasil',
    flag: '🇧🇷',
    defaultCurrency: 'BRL',
    documents: [
      { id: 'CPF', name: 'CPF (Persona Física)', placeholder: '000.000.000-00', description: 'Cadastro de Pessoas Físicas (11 dígitos)' },
      { id: 'CNPJ', name: 'CNPJ (Empresa)', placeholder: '00.000.000/0000-00', description: 'Cadastro Nacional da Pessoa Jurídica (14 dígitos)' },
    ],
  },
  {
    code: 'AR',
    name: 'Argentina',
    flag: '🇦🇷',
    defaultCurrency: 'ARS',
    documents: [
      { id: 'DNI', name: 'DNI (Documento Nacional de Identidad)', placeholder: '12.345.678' },
      { id: 'CUIL_CUIT', name: 'CUIL / CUIT', placeholder: '20-12345678-9' },
      { id: 'PASAPORTE', name: 'Pasaporte', placeholder: 'A12345678' },
    ],
  },
  {
    code: 'CO',
    name: 'Colombia',
    flag: '🇨🇴',
    defaultCurrency: 'COP',
    documents: [
      { id: 'CC', name: 'Cédula de Ciudadanía (CC)', placeholder: '1.234.567.890' },
      { id: 'CE', name: 'Cédula de Extranjería (CE)', placeholder: '123456' },
      { id: 'NIT', name: 'NIT (Empresas)', placeholder: '900.123.456-1' },
      { id: 'PASAPORTE', name: 'Pasaporte', placeholder: 'A12345678' },
    ],
  },
  {
    code: 'PE',
    name: 'Perú',
    flag: '🇵🇪',
    defaultCurrency: 'PEN',
    documents: [
      { id: 'DNI', name: 'DNI (Documento Nacional de Identidad)', placeholder: '12345678' },
      { id: 'CE', name: 'Carné de Extranjería (CE)', placeholder: '001234567' },
      { id: 'RUC', name: 'RUC (Empresas / Tributario)', placeholder: '20123456789' },
      { id: 'PASAPORTE', name: 'Pasaporte', placeholder: 'A12345678' },
    ],
  },
  {
    code: 'CL',
    name: 'Chile',
    flag: '🇨🇱',
    defaultCurrency: 'CLP',
    documents: [
      { id: 'RUT', name: 'RUT / RUN', placeholder: '12.345.678-K' },
      { id: 'PASAPORTE', name: 'Pasaporte', placeholder: 'A12345678' },
    ],
  },
  {
    code: 'MX',
    name: 'México',
    flag: '🇲🇽',
    defaultCurrency: 'USD',
    documents: [
      { id: 'CURP', name: 'CURP', placeholder: 'ABCD123456HDFRND01' },
      { id: 'RFC', name: 'RFC', placeholder: 'ABCD123456XYZ' },
      { id: 'INE', name: 'INE / IFE', placeholder: '1234567890123' },
      { id: 'PASAPORTE', name: 'Pasaporte', placeholder: 'A12345678' },
    ],
  },
  {
    code: 'UY',
    name: 'Uruguay',
    flag: '🇺🇾',
    defaultCurrency: 'USD',
    documents: [
      { id: 'CI', name: 'Cédula de Identidad (CI)', placeholder: '1.234.567-8' },
      { id: 'RUT', name: 'RUT', placeholder: '219999990019' },
      { id: 'PASAPORTE', name: 'Pasaporte', placeholder: 'A12345678' },
    ],
  },
  {
    code: 'VE',
    name: 'Venezuela',
    flag: '🇻🇪',
    defaultCurrency: 'VES',
    documents: [
      { id: 'CI', name: 'Cédula de Identidad (V / E)', placeholder: 'V-12345678' },
      { id: 'RIF', name: 'RIF (Tributario)', placeholder: 'J-12345678-0' },
      { id: 'PASAPORTE', name: 'Pasaporte', placeholder: 'A12345678' },
    ],
  },
  {
    code: 'EC',
    name: 'Ecuador',
    flag: '🇪🇨',
    defaultCurrency: 'USD',
    documents: [
      { id: 'CEDULA', name: 'Cédula de Identidad', placeholder: '1234567890' },
      { id: 'RUC', name: 'RUC', placeholder: '1234567890001' },
      { id: 'PASAPORTE', name: 'Pasaporte', placeholder: 'A12345678' },
    ],
  },
  {
    code: 'OT',
    name: 'Otro País / Internacional',
    flag: '🌐',
    defaultCurrency: 'USD',
    documents: [
      { id: 'PASAPORTE', name: 'Pasaporte Internacional', placeholder: 'A12345678' },
      { id: 'ID_NACIONAL', name: 'Documento Nacional de Identidad / ID', placeholder: '123456789' },
      { id: 'TAX_ID', name: 'Tax ID / Identificación Fiscal', placeholder: 'TAX-123456' },
    ],
  },
];

export function getCountryByCode(code: string): CountryInfo {
  return COUNTRIES.find((c) => c.code === code) || COUNTRIES[0];
}
