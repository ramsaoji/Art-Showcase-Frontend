export const ACCOUNT_STATES = {
  ACTIVE: "ACTIVE",
  PENDING_EMAIL_VERIFICATION: "PENDING_EMAIL_VERIFICATION",
  PENDING_APPROVAL: "PENDING_APPROVAL",
  SUSPENDED: "SUSPENDED",
};

export const ROLES = {
  SUPER_ADMIN: "SUPER_ADMIN",
  ADMIN: "ADMIN",
  ARTIST: "ARTIST",
  USER: "USER",
};

export const PERMISSIONS = {
  USER_READ_ANY: "user.read:any",
  USER_ROLE_MANAGE: "user.role.manage",
  USER_STATE_MANAGE: "user.state.manage",
  USER_DELETE_ANY: "user.delete:any",
  ARTIST_APPROVE: "artist.approve",
  ARTIST_QUOTA_MANAGE: "artist.quota.manage",
  ARTIST_READ_ANY: "artist.read:any",
  PROFILE_READ_SELF: "profile.read:self",
  PROFILE_UPDATE_SELF: "profile.update:self",
  ACTIVITY_READ_OWN: "activity.read:own",
  AUDIT_READ_ANY: "audit.read:any",
  QUOTA_READ_ANY: "quota.read:any",
  ARTWORK_READ_PUBLIC: "artwork.read:public",
  ARTWORK_READ_OWN: "artwork.read:own",
  ARTWORK_READ_ANY: "artwork.read:any",
  ARTWORK_CREATE_OWN: "artwork.create:own",
  ARTWORK_CREATE_ANY: "artwork.create:any",
  ARTWORK_UPDATE_OWN: "artwork.update:own",
  ARTWORK_UPDATE_ANY: "artwork.update:any",
  ARTWORK_DELETE_ANY: "artwork.delete:any",
  ARTWORK_STATUS_MANAGE: "artwork.status.manage",
  ARTWORK_FEATURE_MANAGE: "artwork.feature.manage",
  CAROUSEL_MANAGE: "carousel.manage",
  AI_GENERATE_OWN: "ai.generate:own",
};

export function hasPermission(user, permission) {
  return !!user?.permissions?.includes(permission);
}

export function isStaffRole(role) {
  return role === ROLES.SUPER_ADMIN || role === ROLES.ADMIN;
}

export function isArtistRole(role) {
  return role === ROLES.ARTIST;
}

export function getRoleLabel(role) {
  switch (role) {
    case ROLES.SUPER_ADMIN:
      return "Super Admin";
    case ROLES.ADMIN:
      return "Admin";
    case ROLES.ARTIST:
      return "Artist";
    case ROLES.USER:
      return "User";
    default:
      return null;
  }
}

export function canManageAnyArtwork(user) {
  return (
    hasPermission(user, PERMISSIONS.ARTWORK_READ_ANY) ||
    hasPermission(user, PERMISSIONS.ARTWORK_CREATE_ANY) ||
    hasPermission(user, PERMISSIONS.ARTWORK_UPDATE_ANY) ||
    hasPermission(user, PERMISSIONS.ARTWORK_DELETE_ANY) ||
    hasPermission(user, PERMISSIONS.ARTWORK_STATUS_MANAGE) ||
    hasPermission(user, PERMISSIONS.ARTWORK_FEATURE_MANAGE) ||
    hasPermission(user, PERMISSIONS.CAROUSEL_MANAGE)
  );
}

export function canViewOwnArtwork(user, ownerId) {
  return (
    !!user &&
    user.id === ownerId &&
    hasPermission(user, PERMISSIONS.ARTWORK_READ_OWN)
  );
}

export function canViewArtworkInternals(user, ownerId) {
  return canManageAnyArtwork(user) || canViewOwnArtwork(user, ownerId);
}
