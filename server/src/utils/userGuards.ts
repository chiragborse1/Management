import type { IAdmin, IMessOwner, IStudent, IUser } from '../models/User.js';

/**
 * Type guards for the User discriminator models.
 * The `role` field is a plain enum on IUser (not a discriminated union),
 * so TS cannot narrow `IUser` to the specific discriminator type without
 * explicit predicates like these.
 */

export const isAdminUser = (user: IUser | undefined | null): user is IAdmin => {
  return user?.role === 'admin';
};

export const isStudentUser = (user: IUser | undefined | null): user is IStudent => {
  return user?.role === 'student';
};

export const isMessOwnerUser = (user: IUser | undefined | null): user is IMessOwner => {
  return user?.role === 'mess_owner';
};
