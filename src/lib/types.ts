export interface Efficiency {
  metric: string;
  value: number;
  label: string;
}

export interface ProductSpec {
  efficiency?: Efficiency;
  efficiency2?: Efficiency;
  soundDb?: number;
  warranty?: string;
  features?: string[];
  cons?: string[];
  comfort?: { score: number; notes?: string[] };
}

export interface SpecRow {
  label: string;
  value: string;
}

export interface Product {
  id: string;
  category: string;
  brand: string | null;
  model: string | null;
  size: string;
  unit: string | null;
  value: number | null;
  /** strike-through / "regular" price */
  regularPrice: number | null;
  costPrice: number | null;
  salePrice: number | null;
  /** the price the customer is quoted: salePrice ?? regularPrice */
  quotePrice: number | null;
  needsManualPrice: boolean;
  image: string | null;
  spec: ProductSpec | null;
  runCost: { cost: number; basis: string } | null;
  specRows: SpecRow[];
}

export interface RepairService {
  id: string;
  category: string;
  service: string;
  description: string;
  priceFrom: number;
  priceTo: number;
  flatRate: boolean;
  summary: string;
  scope: string[];
}

export interface RepairGroup {
  category: string;
  services: RepairService[];
}

export interface SectionDef {
  key: string;
  label: string;
  icon: string;
  intro: string;
  equipment: string[];
  repairs: string[];
  groups?: { key: string; label: string; equipment: string[]; repairs: string[] }[];
}

export interface CategoryContent {
  summary: string;
  scope: string[];
}

export type PropertyType =
  | 'Bungalow'
  | '2-Story House'
  | '3-Story House'
  | 'Townhouse'
  | 'Condo'
  | 'Multi-unit'
  | 'Commercial';

export interface HomeDetails {
  propertyType: PropertyType | '';
  squareFeet: string;
  yearBuilt: string;
  bathrooms: string;
  occupants: string;
  finishedBasement: 'Yes' | 'No' | 'No Basement' | '';
  atticInsulationAge: 'New (0-5 yrs)' | 'Mid (6-15 yrs)' | 'Old (16+ yrs)' | 'Unknown' | '';
  existingHeating: string;
}

export interface Customer {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;
  notes: string;
}

export interface QuoteLine {
  /** product id, repair id, or a synthetic id for custom lines */
  id: string;
  kind: 'product' | 'repair' | 'custom';
  sectionKey: string;
  name: string;
  detail: string;
  qty: number;
  unitPrice: number;
  /** the pre-discount list price, for showing a saving */
  regularPrice: number | null;
  image: string | null;
}

export type QuoteStatus = 'draft' | 'sent' | 'signed' | 'scheduled' | 'cancelled';

export interface Quote {
  id: string;
  number: string;
  status: QuoteStatus;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  customer: Customer;
  home: HomeDetails;
  lines: QuoteLine[];
  discount: { kind: 'amount' | 'percent'; value: number };
  taxRate: number;
  finance: import('./finance').FinanceInput;
  /** set when the customer finalises; drives the schedule board */
  booking: { date: string; slot: string; notes: string } | null;
  shareToken: string;
}
