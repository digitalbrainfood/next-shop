// Decides where the "Dashboard" affordance should send a user.
// - Super admins go to /admin (the multi-school view)
// - Teachers (have class or avatarClass claim) go to /dashboard
// - Anyone else (viewer only, or storefront-only) returns null
export function dashboardRouteFor(claims, hardcodedSuperAdminUid, currentUid) {
    if (!claims) return null;
    if (claims.superAdmin === true || currentUid === hardcodedSuperAdminUid) return '/admin';
    if (claims.class || claims.avatarClass) return '/dashboard';
    return null;
}
