import { Navigate, useLocation } from "react-router-dom";
import { getAuthSession } from "@/lib/auth";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const session = getAuthSession();
    const location = useLocation();

    if (!session) {
        // Redirect to login if not authenticated
        return <Navigate to="/auth" state={{ from: location }} replace />;
    }

    return <>{children}</>;
}
