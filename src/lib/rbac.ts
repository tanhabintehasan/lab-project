/**
 * Centralized Role-Based Access Control (RBAC)
 *
 * Two protection models:
 * 1. Strict role-string matching for route-level middleware/layout guards.
 * 2. Permission-bitmask matching for fine-grained API action control.
 *
 * DO NOT use simple boolean abstractions like `isAdmin(role)`.
 * Always compare against explicit role arrays or bitmasks.
 */

// ─── Strict Role Constants ───────────────────────────────────

export const ROLES = {
  VISITOR: 'VISITOR',
  CUSTOMER: 'CUSTOMER',
  ENTERPRISE_MEMBER: 'ENTERPRISE_MEMBER',
  LAB_PARTNER: 'LAB_PARTNER',
  LAB_MANAGER: 'LAB_MANAGER',
  TECHNICIAN: 'TECHNICIAN',
  FINANCE_ADMIN: 'FINANCE_ADMIN',
  SUPER_ADMIN: 'SUPER_ADMIN',
} as const;

export type AppRole = (typeof ROLES)[keyof typeof ROLES];

export const ALL_ROLES: AppRole[] = Object.values(ROLES);

// ─── Route Access Rules (strict string array matching) ───────

interface RouteRule {
  /** Path prefix to match */
  prefix: string;
  /** Exact role strings allowed */
  allowedRoles: AppRole[];
}

export const ROUTE_RULES: RouteRule[] = [
  {
    prefix: '/admin',
    allowedRoles: [ROLES.SUPER_ADMIN, ROLES.FINANCE_ADMIN],
  },
  {
    prefix: '/lab-portal',
    allowedRoles: [ROLES.LAB_MANAGER, ROLES.TECHNICIAN, ROLES.LAB_PARTNER],
  },
];

/**
 * Check if a role is allowed to access a given pathname.
 * Uses strict string-in-array comparison (===).
 */
export function checkRouteAccess(role: string, pathname: string): boolean {
  for (const rule of ROUTE_RULES) {
    if (pathname.startsWith(rule.prefix)) {
      // Strict equality check against each allowed role
      return rule.allowedRoles.some((allowed) => allowed === role);
    }
  }
  // Public routes: no restriction
  return true;
}

/**
 * Get the list of allowed roles for a route prefix.
 */
export function getAllowedRolesForRoute(pathname: string): AppRole[] | null {
  for (const rule of ROUTE_RULES) {
    if (pathname.startsWith(rule.prefix)) {
      return rule.allowedRoles;
    }
  }
  return null;
}

// ─── Permission Bitmask System ───────────────────────────────

export const Permissions = {
  VIEW_PUBLIC: 1 << 0,
  CREATE_ORDER: 1 << 1,
  VIEW_OWN_ORDERS: 1 << 2,
  VIEW_ASSIGNED_ORDERS: 1 << 3,
  UPDATE_ASSIGNED_ORDERS: 1 << 4,
  MANAGE_SAMPLES: 1 << 5,
  MANAGE_TESTS: 1 << 6,
  UPLOAD_REPORTS: 1 << 7,
  APPROVE_REPORTS: 1 << 8,
  MANAGE_LAB_EQUIPMENT: 1 << 9,
  VIEW_ALL_ORDERS: 1 << 10,
  MANAGE_PAYMENTS: 1 << 11,
  MANAGE_WALLETS: 1 << 12,
  MANAGE_INVOICES: 1 << 13,
  MANAGE_USERS: 1 << 14,
  MANAGE_LABS: 1 << 15,
  MANAGE_CMS: 1 << 16,
  VIEW_ANALYTICS: 1 << 17,
  MANAGE_SETTINGS: 1 << 18,
  ADMIN_FULL: 1 << 31,
} as const;

export type PermissionFlag = (typeof Permissions)[keyof typeof Permissions];

/**
 * Role-to-permissions bitmask mapping.
 */
export const ROLE_PERMISSIONS: Record<string, number> = {
  [ROLES.VISITOR]: Permissions.VIEW_PUBLIC,

  [ROLES.CUSTOMER]:
    Permissions.VIEW_PUBLIC |
    Permissions.CREATE_ORDER |
    Permissions.VIEW_OWN_ORDERS,

  [ROLES.ENTERPRISE_MEMBER]:
    Permissions.VIEW_PUBLIC |
    Permissions.CREATE_ORDER |
    Permissions.VIEW_OWN_ORDERS,

  [ROLES.LAB_PARTNER]:
    Permissions.VIEW_PUBLIC |
    Permissions.VIEW_ASSIGNED_ORDERS |
    Permissions.UPDATE_ASSIGNED_ORDERS |
    Permissions.MANAGE_SAMPLES |
    Permissions.MANAGE_TESTS |
    Permissions.UPLOAD_REPORTS |
    Permissions.MANAGE_LAB_EQUIPMENT,

  [ROLES.LAB_MANAGER]:
    Permissions.VIEW_PUBLIC |
    Permissions.VIEW_ASSIGNED_ORDERS |
    Permissions.UPDATE_ASSIGNED_ORDERS |
    Permissions.MANAGE_SAMPLES |
    Permissions.MANAGE_TESTS |
    Permissions.UPLOAD_REPORTS |
    Permissions.APPROVE_REPORTS |
    Permissions.MANAGE_LAB_EQUIPMENT |
    Permissions.VIEW_ANALYTICS,

  [ROLES.TECHNICIAN]:
    Permissions.VIEW_PUBLIC |
    Permissions.VIEW_ASSIGNED_ORDERS |
    Permissions.MANAGE_SAMPLES |
    Permissions.MANAGE_TESTS |
    Permissions.UPLOAD_REPORTS,

  [ROLES.FINANCE_ADMIN]:
    Permissions.VIEW_PUBLIC |
    Permissions.VIEW_ALL_ORDERS |
    Permissions.MANAGE_PAYMENTS |
    Permissions.MANAGE_WALLETS |
    Permissions.MANAGE_INVOICES |
    Permissions.VIEW_ANALYTICS,

  [ROLES.SUPER_ADMIN]: 0xffffffff, // All bits set
};

/**
 * Check if a role has a specific permission using bitwise AND.
 * SUPER_ADMIN (0xffffffff) always passes.
 */
export function hasPermission(role: string, permission: PermissionFlag): boolean {
  const roleMask = ROLE_PERMISSIONS[role] ?? 0;
  return (roleMask & permission) === permission;
}

/**
 * Check if a role has ANY of the given permissions.
 */
export function hasAnyPermission(role: string, ...permissions: PermissionFlag[]): boolean {
  const roleMask = ROLE_PERMISSIONS[role] ?? 0;
  const requiredMask = permissions.reduce((acc, p) => acc | p, 0);
  return (roleMask & requiredMask) !== 0;
}

/**
 * Check if a role has ALL of the given permissions.
 */
export function hasAllPermissions(role: string, ...permissions: PermissionFlag[]): boolean {
  const roleMask = ROLE_PERMISSIONS[role] ?? 0;
  const requiredMask = permissions.reduce((acc, p) => acc | p, 0);
  return (roleMask & requiredMask) === requiredMask;
}

/**
 * Assert that a role has a permission; throws if not.
 */
export function requirePermission(role: string, permission: PermissionFlag): void {
  if (!hasPermission(role, permission)) {
    throw new Error(`Role ${role} lacks required permission 0x${permission.toString(16)}`);
  }
}

// ─── API Route Guard Helpers ─────────────────────────────────

/**
 * Strict role-array guard for API handlers.
 * Returns the matched role or null.
 */
export function matchRole(userRole: string, allowedRoles: AppRole[]): AppRole | null {
  return allowedRoles.find((r) => r === userRole) ?? null;
}

/**
 * Check if a user role is in an explicit allow-list.
 * Prefer this over `isAdmin()` boolean checks.
 */
export function isRoleIn(userRole: string, allowedRoles: AppRole[]): boolean {
  return allowedRoles.some((r) => r === userRole);
}
