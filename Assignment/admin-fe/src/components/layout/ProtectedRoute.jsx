// src/components/layout/ProtectedRoute.jsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

function ProtectedRoute({ isLoggedIn, children }) {
    const location = useLocation();
    if (!isLoggedIn) {
        return <Navigate to="/login" state={{ from: location.pathname }} replace />;
    }
    return children;
}

export default ProtectedRoute;
