import { Navigate, useLocation } from "react-router-dom";

import { getAuthSession } from "@/lib/auth";

type Role = "school_admin" | "teacher" | "student" | "parent";

export function RoleRoute({ children, allowed }: { children: React.ReactNode; allowed: Role[] }) {
  const session = getAuthSession();
  const location = useLocation();

  if (!session) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  const role = (session.user as any).role ?? "student";

  if (!allowed.includes(role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
