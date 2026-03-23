import type { StaffUser } from '../types/auth';

export function canViewStaff(staff: StaffUser | null, resource: string): boolean {
  if (!staff) {
    return false;
  }
  return staff.permissions[resource]?.view === true;
}
