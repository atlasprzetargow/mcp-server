export interface TenderSummary {
  id: string;
  title: string;
  buyer: string;
  buyerNip: string | null;
  buyerSlug: string | null;
  city: string | null;
  province: string | null;
  cpvCode: string | null;
  noticeType: string | null;
  tenderType: string | null;
  date: string | null;
  submittingOffersDate: string | null;
  estimatedValue: number | null;
  currency: string | null;
  depositAmount: number | null;
  contractors: unknown[];
  contractorName: string | null;
  contractorSlug: string | null;
  offersCount: number | null;
  procedureResult: string | null;
  source: string | null;
  noticeUrl: string | null;
  tedNumber: string | null;
  latitude: number | null;
  longitude: number | null;
}

export interface TenderListResponse {
  data: TenderSummary[];
  total?: number;
  page?: number;
  per_page?: number;
  pages?: number;
}

export interface TenderDetail extends TenderSummary {
  bzpNumber?: string | null;
  cancellationReason?: string | null;
  clientType?: string | null;
  contractorCity?: string | null;
  contractorProvince?: string | null;
  contractorNationalId?: string | null;
  htmlBody?: string | null;
  [key: string]: unknown;
}

export interface BuyerProfile {
  nip: string;
  name: string;
  displayName: string | null;
  city: string | null;
  province: string | null;
  recent_tenders?: TenderSummary[];
  [key: string]: unknown;
}

export interface ContractorProfile {
  nip: string;
  name: string;
  displayName: string | null;
  [key: string]: unknown;
}

export interface EntitySearchResult {
  nip: string;
  name: string;
  displayName: string | null;
  city: string | null;
  province: string | null;
  count: number;
  value: number;
  slug: string | null;
  lastDate: string | null;
  vipData?: unknown;
}

export interface CategoryStats {
  cpv: string;
  days: number;
  count_period: number;
  count_total: number;
  avg_value: number | null;
  median_value: number | null;
  avg_offers_count: number | null;
  avg_deadline_days: number | null;
  value_sample_size: number;
  offers_sample_size: number;
  deadline_sample_size: number;
}

export interface ProvinceAggItem {
  value: string;
  total: number;
}

export interface ProvinceAggResponse {
  data: ProvinceAggItem[];
}

export interface CpvSearchItem {
  code: string;
  code8: string;
  division: string;
  divisionName: string;
  label: string;
  name: string;
  count: number;
}

export interface CpvSearchResponse {
  data: CpvSearchItem[];
}

export interface WinningContractorsResponse {
  contractors: Array<{
    nip: string | null;
    name: string;
    wins: number;
    totalValue: number | null;
    slug: string | null;
  }>;
  [key: string]: unknown;
}
