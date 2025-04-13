// src/index.js (hoặc main.jsx)
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css'; // <--- Đảm bảo dòng này tồn tại và đúng vị trí
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
