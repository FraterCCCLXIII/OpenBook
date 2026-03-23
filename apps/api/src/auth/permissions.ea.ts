/** Mirrors easyappointments-logs/application/config/constants.php */
export const PRIV_VIEW = 1;
export const PRIV_ADD = 2;
export const PRIV_EDIT = 4;
export const PRIV_DELETE = 8;

export type ResourceKey =
  | 'appointments'
  | 'customers'
  | 'services'
  | 'users'
  | 'system_settings'
  | 'user_settings'
  | 'webhooks'
  | 'blocked_periods';

export type ActionKey = 'view' | 'add' | 'edit' | 'delete';

export type PermissionsMap = Record<ResourceKey, Record<ActionKey, boolean>>;

/**
 * Mirrors Roles_model::get_permissions_by_slug (PHP).
 */
const RESOURCE_KEYS = new Set<string>([
  'appointments',
  'customers',
  'services',
  'users',
  'system_settings',
  'user_settings',
  'webhooks',
  'blocked_periods',
]);

export function permissionsFromRoleRow(
  row: Record<string, unknown>,
): PermissionsMap {
  const skip = new Set(['id', 'name', 'slug', 'is_admin', 'isAdmin']);
  const permissions = {} as PermissionsMap;

  for (const [resource, raw] of Object.entries(row)) {
    if (skip.has(resource) || !RESOURCE_KEYS.has(resource)) {
      continue;
    }
    let value = typeof raw === 'number' ? raw : Number(raw);
    if (!Number.isFinite(value) || value <= 0) {
      (permissions as Record<string, Record<ActionKey, boolean>>)[resource] = {
        view: false,
        add: false,
        edit: false,
        delete: false,
      };
      continue;
    }

    const perms = {
      view: false,
      add: false,
      edit: false,
      delete: false,
    };

    if (value > 0) {
      if (Math.floor(value / PRIV_DELETE) === 1) {
        perms.delete = true;
        value -= PRIV_DELETE;
      }
      if (Math.floor(value / PRIV_EDIT) === 1) {
        perms.edit = true;
        value -= PRIV_EDIT;
      }
      if (Math.floor(value / PRIV_ADD) === 1) {
        perms.add = true;
      }
      perms.view = true;
    }

    (permissions as Record<string, Record<ActionKey, boolean>>)[resource] =
      perms;
  }

  return permissions;
}

export function canView(perms: PermissionsMap, resource: ResourceKey): boolean {
  return perms[resource]?.view === true;
}

export function can(
  perms: PermissionsMap,
  resource: ResourceKey,
  action: ActionKey,
): boolean {
  return perms[resource]?.[action] === true;
}

const ALL_RESOURCES: ResourceKey[] = [
  'appointments',
  'customers',
  'services',
  'users',
  'system_settings',
  'user_settings',
  'webhooks',
  'blocked_periods',
];

/** Ensures every resource key exists (for clients that iterate nav). */
export function normalizePermissionsMap(
  partial: PermissionsMap,
): PermissionsMap {
  const out = { ...partial } as PermissionsMap;
  for (const key of ALL_RESOURCES) {
    if (!out[key]) {
      out[key] = { view: false, add: false, edit: false, delete: false };
    }
  }
  return out;
}
