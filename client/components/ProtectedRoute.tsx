'use client';

import { useRouter } from 'next/navigation';
import { useEffect, ReactNode } from 'react';
import { isAuthenticated, getUserRole } from '@/lib/auth';

interface ProtectedRouteProps {
    children: ReactNode;
    allowedRoles?: string[];
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
    const router = useRouter();

    useEffect(() => {
        if (!isAuthenticated()) {
            router.push('/login');
            return;
        }

        if (allowedRoles && allowedRoles.length > 0) {
            const userRole = getUserRole();
            if (!userRole || !allowedRoles.includes(userRole)) {
                router.push('/unauthorized');
                return;
            }
        }
    }, [router, allowedRoles]);

    if (!isAuthenticated()) {
        return null;
    }

    if (allowedRoles && allowedRoles.length > 0) {
        const userRole = getUserRole();
        if (!userRole || !allowedRoles.includes(userRole)) {
            return null;
        }
    }

    return <>{children}</>;
}
