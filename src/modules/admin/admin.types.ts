export type AdminCorrectableField =
  | "category"
  | "customerProfile"
  | "asset"
  | "notes";

export interface AdminCorrectionInput {
  field: AdminCorrectableField;
  value: unknown;
  reason: string;
}
