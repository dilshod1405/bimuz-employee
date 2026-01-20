import type { Employee } from "./api"

/**
 * Role hierarchy (higher number = higher privilege)
 * Dasturchi > Direktor > Administrator > Buxgalter > Others
 */
export enum RoleLevel {
  OTHER = 0, // Boshqa rollar: sotuv_agenti, mentor, assistent
  ACCOUNTANT = 1, // Buxgalter
  ADMINISTRATOR = 2, // Administrator
  DIRECTOR = 3, // Direktor
  DEVELOPER = 4, // Dasturchi
}

/**
 * Get role level for permission checks
 */
export function getRoleLevel(role: string | undefined | null): RoleLevel {
  if (!role) return RoleLevel.OTHER

  switch (role) {
    case "dasturchi":
      return RoleLevel.DEVELOPER
    case "direktor":
      return RoleLevel.DIRECTOR
    case "administrator":
      return RoleLevel.ADMINISTRATOR
    case "buxgalter":
      return RoleLevel.ACCOUNTANT
    default:
      return RoleLevel.OTHER // sotuv_agenti, mentor, assistent
  }
}

/**
 * Check if user has full access to all pages
 * Full access: Dasturchi, Direktor, Administrator
 */
export function hasFullAccess(role: string | undefined | null): boolean {
  const level = getRoleLevel(role)
  return level >= RoleLevel.ADMINISTRATOR
}

/**
 * Check if user can read employees page
 */
export function canReadEmployees(role: string | undefined | null): boolean {
  // All roles with full access can read
  return hasFullAccess(role)
}

/**
 * Check if user can create employees
 */
export function canCreateEmployee(
  userRole: string | undefined | null
): boolean {
  const level = getRoleLevel(userRole)
  // Dasturchi, Direktor, Administrator can create
  return level >= RoleLevel.ADMINISTRATOR
}

/**
 * Check if user can update an employee
 */
export function canUpdateEmployee(
  userRole: string | undefined | null,
  targetEmployee: Employee
): boolean {
  const userLevel = getRoleLevel(userRole)
  const targetLevel = getRoleLevel(targetEmployee.role)

  // Dasturchi can update everyone
  if (userLevel === RoleLevel.DEVELOPER) {
    return true
  }

  // Direktor can update everyone except Dasturchi
  if (userLevel === RoleLevel.DIRECTOR) {
    return targetLevel !== RoleLevel.DEVELOPER
  }

  // Administrator can only update roles below them
  if (userLevel === RoleLevel.ADMINISTRATOR) {
    return targetLevel < RoleLevel.ADMINISTRATOR
  }

  // Other roles cannot update anyone
  return false
}

/**
 * Check if user can delete an employee
 */
export function canDeleteEmployee(
  userRole: string | undefined | null,
  targetEmployee: Employee
): boolean {
  // Same logic as update
  return canUpdateEmployee(userRole, targetEmployee)
}

/**
 * Check if user can see an employee (for filtering)
 */
export function canViewEmployee(
  userRole: string | undefined | null,
  targetEmployee: Employee
): boolean {
  const userLevel = getRoleLevel(userRole)
  const targetLevel = getRoleLevel(targetEmployee.role)

  // Dasturchi and Direktor can see everyone
  if (userLevel >= RoleLevel.DIRECTOR) {
    return true
  }

  // Administrator can see everyone (but can only edit/delete those below)
  if (userLevel === RoleLevel.ADMINISTRATOR) {
    return true
  }

  // Other roles shouldn't access employees page at all
  return false
}

/**
 * Check if user can assign a specific role when creating/editing employee
 */
export function canAssignRole(
  userRole: string | undefined | null,
  targetRole: string
): boolean {
  const userLevel = getRoleLevel(userRole)
  const targetLevel = getRoleLevel(targetRole)

  // Dasturchi can assign any role
  if (userLevel === RoleLevel.DEVELOPER) {
    return true
  }

  // Direktor can assign any role except Dasturchi
  if (userLevel === RoleLevel.DIRECTOR) {
    return targetLevel !== RoleLevel.DEVELOPER
  }

  // Administrator can only assign roles below them
  if (userLevel === RoleLevel.ADMINISTRATOR) {
    return targetLevel < RoleLevel.ADMINISTRATOR
  }

  // Other roles cannot assign roles (shouldn't reach here anyway)
  return false
}

/**
 * Get list of roles that user can assign
 */
export function getAssignableRoles(
  userRole: string | undefined | null
): string[] {
  const allRoles = [
    "dasturchi",
    "direktor",
    "administrator",
    "buxgalter",
    "sotuv_agenti",
    "mentor",
    "assistent",
  ]

  return allRoles.filter((role) => canAssignRole(userRole, role))
}
