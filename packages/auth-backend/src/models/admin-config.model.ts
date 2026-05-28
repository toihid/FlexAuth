import mongoose, { Schema, Document } from 'mongoose';

export interface IAdminConfig extends Document {
  providers: IProviderEntry[];
  security: ISecurityConfig;
  branding: IBrandingConfig;
  updatedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IProviderEntry {
  type: string;
  enabled: boolean;
  displayName: string;
  priority: number;
  supportedIdentifiers: string[];
  secrets: Record<string, string>;
  settings: Record<string, unknown>;
}

export interface ISecurityConfig {
  maxLoginAttempts: number;
  lockoutDurationMinutes: number;
  passwordMinLength: number;
  passwordRequireUppercase: boolean;
  passwordRequireNumbers: boolean;
  passwordRequireSymbols: boolean;
  sessionTimeoutMinutes: number;
  mfaEnabled: boolean;
  mfaMethods: string[];
}

export interface IBrandingConfig {
  appName: string;
  logoUrl?: string;
  primaryColor?: string;
  accentColor?: string;
}

const ProviderEntrySchema = new Schema<IProviderEntry>(
  {
    type: { type: String, required: true },
    enabled: { type: Boolean, default: false },
    displayName: { type: String, required: true },
    priority: { type: Number, default: 0 },
    supportedIdentifiers: [{ type: String }],
    secrets: { type: Schema.Types.Mixed, default: {} },
    settings: { type: Schema.Types.Mixed, default: {} },
  },
  { _id: false }
);

const SecurityConfigSchema = new Schema<ISecurityConfig>(
  {
    maxLoginAttempts: { type: Number, default: 5 },
    lockoutDurationMinutes: { type: Number, default: 30 },
    passwordMinLength: { type: Number, default: 8 },
    passwordRequireUppercase: { type: Boolean, default: true },
    passwordRequireNumbers: { type: Boolean, default: true },
    passwordRequireSymbols: { type: Boolean, default: false },
    sessionTimeoutMinutes: { type: Number, default: 60 },
    mfaEnabled: { type: Boolean, default: false },
    mfaMethods: [{ type: String }],
  },
  { _id: false }
);

const BrandingConfigSchema = new Schema<IBrandingConfig>(
  {
    appName: { type: String, default: 'Auth System' },
    logoUrl: { type: String },
    primaryColor: { type: String, default: '#1976d2' },
    accentColor: { type: String, default: '#dc004e' },
  },
  { _id: false }
);

const AdminConfigSchema = new Schema<IAdminConfig>(
  {
    providers: [ProviderEntrySchema],
    security: { type: SecurityConfigSchema, default: () => ({}) },
    branding: { type: BrandingConfigSchema, default: () => ({}) },
    updatedBy: { type: String, default: 'system' },
  },
  { timestamps: true }
);

export const AdminConfig = mongoose.model<IAdminConfig>('AdminConfig', AdminConfigSchema);
