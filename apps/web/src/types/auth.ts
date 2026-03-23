export type StaffPermissions = Record<
  string,
  { view: boolean; add: boolean; edit: boolean; delete: boolean }
>;

export type StaffUser = {
  kind: 'staff';
  userId: string;
  username: string;
  displayName: string;
  roleSlug: string;
  permissions: StaffPermissions;
};

export type CustomerUser = {
  kind: 'customer';
  customerId: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
};

export type AuthUser = StaffUser | CustomerUser;
