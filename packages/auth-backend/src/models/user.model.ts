import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcrypt';

export interface IUser extends Document {
  email?: string;
  username?: string;
  mobile?: string;
  displayName: string;
  avatar?: string;
  passwordHash?: string;
  providers: IProviderLink[];
  roles: string[];
  mfaEnabled: boolean;
  mfaSecret?: string;
  loginAttempts: number;
  lockUntil?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
  isLocked(): boolean;
}

export interface IProviderLink {
  provider: string;
  providerId: string;
  email?: string;
  profile?: Record<string, unknown>;
  linkedAt: Date;
}

const ProviderLinkSchema = new Schema<IProviderLink>({
  provider: { type: String, required: true },
  providerId: { type: String, required: true },
  email: { type: String },
  profile: { type: Schema.Types.Mixed },
  linkedAt: { type: Date, default: Date.now },
});

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
    },
    username: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
    },
    mobile: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    displayName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    avatar: { type: String },
    passwordHash: { type: String },
    providers: [ProviderLinkSchema],
    roles: {
      type: [String],
      default: ['user'],
    },
    mfaEnabled: { type: Boolean, default: false },
    mfaSecret: { type: String },
    loginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret: Record<string, any>) {
        delete ret.passwordHash;
        delete ret.mfaSecret;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Indexes for fast login lookup
UserSchema.index({ 'providers.provider': 1, 'providers.providerId': 1 });

// Hash password before save
UserSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash') || !this.passwordHash) {
    return next();
  }
  const salt = await bcrypt.genSalt(12);
  this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
  next();
});

// Compare password method
UserSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  if (!this.passwordHash) return false;
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

// Check if account is locked
UserSchema.methods.isLocked = function (): boolean {
  return !!(this.lockUntil && this.lockUntil > new Date());
};

export const User = mongoose.model<IUser>('User', UserSchema);
