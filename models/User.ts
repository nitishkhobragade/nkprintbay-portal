/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * models/User.ts
 * MongoDB / Mongoose Schema for NP Print Portal.
 * Handles authentication, role-based access, subscription validity,
 * and single-device active session enforcement via unique sessionToken.
 */

import mongoose, { Schema, Document, Model } from 'mongoose';

export type UserRole = 'admin' | 'user' | 'master';
export type PlanStatus = 'active' | 'expired' | 'suspended';

export interface IUser extends Document {
  name: string;
  email: string;
  phone?: string;
  password: string; // bcrypt/argon2 hashed password
  role: UserRole;
  planStatus: PlanStatus;
  planExpiresAt: Date;
  currentSessionToken: string | null; // UUID/token for single-device enforcement
  createdAt: Date;
  updatedAt: Date;
  
  // Helper methods
  isPlanActive(): boolean;
  isValidSession(token: string): boolean;
}

const UserSchema: Schema<IUser> = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        'Please provide a valid email address',
      ],
    },
    phone: {
      type: String,
      trim: true,
      default: '',
      index: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false, // Don't return password in queries by default
    },
    role: {
      type: String,
      enum: ['admin', 'user', 'master'],
      default: 'user',
      index: true,
    },
    planStatus: {
      type: String,
      enum: ['active', 'expired', 'suspended'],
      default: 'active',
      index: true,
    },
    planExpiresAt: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Default 30 days
      index: true,
    },
    currentSessionToken: {
      type: String,
      default: null,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Checks whether user has an active, unexpired plan.
 */
UserSchema.methods.isPlanActive = function (this: IUser): boolean {
  if (this.planStatus === 'suspended') return false;
  return new Date() <= new Date(this.planExpiresAt);
};

/**
 * Validates whether the incoming session token matches the active single-device token in DB.
 */
UserSchema.methods.isValidSession = function (this: IUser, token: string): boolean {
  if (!this.currentSessionToken || !token) return false;
  return this.currentSessionToken === token;
};

// Check if model already exists to prevent OverwriteModelError in serverless / HMR environments
const User: Model<IUser> =
  (mongoose.models && mongoose.models.User) ||
  mongoose.model<IUser>('User', UserSchema);

export default User;
