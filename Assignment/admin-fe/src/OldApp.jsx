import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AdminPage = () => {
    const [token, setToken] = useState(localStorage.getItem('token') || '');
    const [loginData, setLoginData] = useState({ email: 'admin@example.com', password: 'admin123' }); // Default credentials
    const [activeTab, setActiveTab] = useState('users');
    const [users, setUsers] = useState([]);
    const [categories, setCategories] = useState([]);
    const [products, setProducts] = useState([]);
    const [orders, setOrders] = useState([]);
    const [formData, setFormData] = useState({});
    const [editingId, setEditingId] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const API_URL = 'http://localhost:5000/api';

    // Login function
    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        console.log('Attempting login with:', loginData);

        try {
            const res = await axios.post(`${API_URL}/login`, loginData, {
                headers: { 'Content-Type': 'application/json' }
            });
            console.log('Login response:', res.data);
            setToken(res.data.token);
            localStorage.setItem('token', res.data.token);
            setLoginData({ email: '', password: '' });
        } catch (error) {
            const errorMsg = error.response?.data?.message || error.message;
            setError(`Login failed: ${errorMsg}`);
            console.error('Login error:', {
                status: error.response?.status,
                data: error.response?.data,
                message: error.message
            });
        } finally {
            setLoading(false);
        }
    };

    // Fetch data
    const fetchData = async (endpoint, setter) => {
        setLoading(true);
        console.log(`Fetching ${endpoint} with token:`, token);
        try {
            const res = await axios.get(`${API_URL}/${endpoint}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log(`${endpoint} response:`, res.data);
            setter(res.data);
            setError('');
        } catch (error) {
            const errorMsg = error.response?.data?.message || error.message;
            setError(`Error fetching ${endpoint}: ${errorMsg}`);
            console.error(`Fetch ${endpoint} error:`, error.response || error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token) {
            fetchData('users', setUsers);
            fetchData('categories', setCategories);
            fetchData('products', setProducts);
            fetchData('orders', setOrders);
        }
    }, [token]);

    // CRUD operations
    const handleSubmit = async (e, endpoint) => {
        e.preventDefault();
        setLoading(true);
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            let res;
            if (editingId) {
                res = await axios.put(`${API_URL}/${endpoint}/${editingId}`, formData, config);
            } else {
                res = await axios.post(`${API_URL}/${endpoint}`, formData, config);
            }
            console.log(`${endpoint} submit response:`, res.data);
            setFormData({});
            setEditingId(null);
            fetchData(endpoint, getSetter(endpoint));
            setError('');
        } catch (error) {
            setError(`Operation failed: ${error.response?.data?.message || error.message}`);
            console.error('Submit error:', error.response || error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (endpoint, id) => {
        setLoading(true);
        try {
            await axios.delete(`${API_URL}/${endpoint}/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchData(endpoint, getSetter(endpoint));
            setError('');
        } catch (error) {
            setError(`Delete failed: ${error.response?.data?.message || error.message}`);
            console.error('Delete error:', error.response || error);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (item, endpoint) => {
        setFormData({ ...item, password: '' });
        setEditingId(item._id);
        setActiveTab(endpoint);
    };

    const getSetter = (endpoint) => ({
        users: setUsers,
        categories: setCategories,
        products: setProducts,
        orders: setOrders
    }[endpoint] || (() => { }));

    // Render form
    const renderForm = () => {
        const forms = {
            users: (
                <form onSubmit={(e) => handleSubmit(e, 'users')}>
                    <input placeholder="Fullname" value={formData.fullname || ''} onChange={(e) => setFormData({ ...formData, fullname: e.target.value })} />
                    <input placeholder="Email" value={formData.email || ''} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                    <input placeholder="Phone" value={formData.phone_number || ''} onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })} />
                    <input placeholder="Password" type="password" value={formData.password || ''} onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
                    <input placeholder="Address" value={formData.address || ''} onChange={(e) => setFormData({ ...formData, address: e.target.value })} />
                    <select value={formData.role_id || ''} onChange={(e) => setFormData({ ...formData, role_id: Number(e.target.value) })}>
                        <option value="">Select Role</option>
                        <option value={1}>Admin</option>
                        <option value={2}>User</option>
                        <option value={3}>Nhân viên</option>
                    </select>
                    <button type="submit" disabled={loading}>{editingId ? 'Update' : 'Add'} User</button>
                </form>
            ),
            categories: (
                <form onSubmit={(e) => handleSubmit(e, 'categories')}>
                    <input placeholder="Name" value={formData.name || ''} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                    <button type="submit" disabled={loading}>{editingId ? 'Update' : 'Add'} Category</button>
                </form>
            ),
            products: (
                <form onSubmit={(e) => handleSubmit(e, 'products')}>
                    <input placeholder="Name" value={formData.name || ''} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                    <input placeholder="Price" type="number" value={formData.price || ''} onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })} />
                    <input placeholder="Picture URL" value={formData.picture || ''} onChange={(e) => setFormData({ ...formData, picture: e.target.value })} />
                    <textarea placeholder="Description" value={formData.description || ''} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
                    <select value={formData.category_id || ''} onChange={(e) => setFormData({ ...formData, category_id: Number(e.target.value) })}>
                        <option value="">Select Category</option>
                        {categories.map(cat => <option key={cat._id} value={cat._id}>{cat.name}</option>)}
                    </select>
                    <button type="submit" disabled={loading}>{editingId ? 'Update' : 'Add'} Product</button>
                </form>
            ),
            orders: (
                <form onSubmit={(e) => handleSubmit(e, 'orders')}>
                    <input placeholder="User ID" type="number" value={formData.user_id || ''} onChange={(e) => setFormData({ ...formData, user_id: Number(e.target.value) })} />
                    <input placeholder="Message" value={formData.message || ''} onChange={(e) => setFormData({ ...formData, message: e.target.value })} />
                    <input placeholder="Status" value={formData.status || ''} onChange={(e) => setFormData({ ...formData, status: e.target.value })} />
                    <input placeholder="Total Money" type="number" value={formData.total_money || ''} onChange={(e) => setFormData({ ...formData, total_money: Number(e.target.value) })} />
                    <button type="submit" disabled={loading}>{editingId ? 'Update' : 'Add'} Order</button>
                </form>
            )
        };
        return forms[activeTab];
    };

    // Render table
    const renderTable = () => {
        const data = { users, categories, products, orders }[activeTab];
        if (!data || data.length === 0) return <p>No data available</p>;

        const headers = Object.keys(data[0]).filter(key => key !== 'password');
        return (
            <table>
                <thead>
                    <tr>{headers.map(key => <th key={key}>{key}</th>)}<th>Actions</th></tr>
                </thead>
                <tbody>
                    {data.map(item => (
                        <tr key={item._id}>
                            {headers.map(key => (
                                <td key={key}>{typeof item[key] === 'object' ? JSON.stringify(item[key]) : item[key]}</td>
                            ))}
                            <td>
                                <button onClick={() => handleEdit(item, activeTab)} disabled={loading}>Edit</button>
                                <button onClick={() => handleDelete(activeTab, item._id)} disabled={loading}>Delete</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        );
    };

    if (!token) {
        return (
            <div className="login-container">
                <h1>Admin Login</h1>
                {error && <p className="error">{error}</p>}
                {loading && <p>Loading...</p>}
                <form onSubmit={handleLogin}>
                    <input
                        placeholder="Email"
                        value={loginData.email}
                        onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={loginData.password}
                        onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                    />
                    <button type="submit" disabled={loading}>{loading ? 'Logging in...' : 'Login'}</button>
                </form>
                <style jsx>{`
          .login-container {
            max-width: 400px;
            margin: 50px auto;
            padding: 20px;
            text-align: center;
          }
          .error {
            color: red;
            margin-bottom: 10px;
          }
          input {
            display: block;
            width: 100%;
            margin: 10px 0;
            padding: 8px;
          }
          button {
            padding: 8px 16px;
            background-color: #007bff;
            color: white;
            border: none;
            cursor: pointer;
          }
          button:disabled {
            background-color: #6c757d;
            cursor: not-allowed;
          }
          button:hover:not(:disabled) {
            background-color: #0056b3;
          }
        `}</style>
            </div>
        );
    }

    return (
        <div className="admin-container">
            <h1>Admin Dashboard</h1>
            <button onClick={() => { localStorage.removeItem('token'); setToken(''); setError(''); }}>Logout</button>
            {error && <p className="error">{error}</p>}
            {loading && <p>Loading...</p>}

            <div className="tabs">
                <button onClick={() => setActiveTab('users')}>Users</button>
                <button onClick={() => setActiveTab('categories')}>Categories</button>
                <button onClick={() => setActiveTab('products')}>Products</button>
                <button onClick={() => setActiveTab('orders')}>Orders</button>
            </div>

            <div className="form-container">{renderForm()}</div>
            <div className="table-container">{renderTable()}</div>

            <style jsx>{`
        .admin-container {
          padding: 20px;
          max-width: 1200px;
          margin: 0 auto;
        }
        .error {
          color: red;
          margin: 10px 0;
        }
        .tabs {
          margin: 20px 0;
        }
        .tabs button {
          margin-right: 10px;
          padding: 8px 16px;
          background-color: #f8f9fa;
          border: 1px solid #ddd;
          cursor: pointer;
        }
        .tabs button:hover {
          background-color: #e9ecef;
        }
        .form-container {
          margin-bottom: 20px;
        }
        .form-container input, .form-container select, .form-container textarea {
          display: block;
          width: 300px;
          margin: 10px 0;
          padding: 8px;
        }
        .form-container button {
          padding: 8px 16px;
          background-color: #28a745;
          color: white;
          border: none;
          cursor: pointer;
        }
        .form-container button:disabled {
          background-color: #6c757d;
          cursor: not-allowed;
        }
        .form-container button:hover:not(:disabled) {
          background-color: #218838;
        }
        .table-container {
          overflow-x: auto;
        }
        table {
          width: 100%;
          border-collapse: collapse;
        }
        th, td {
          border: 1px solid #ddd;
          padding: 8px;
          text-align: left;
        }
        th {
          background-color: #f2f2f2;
        }
        td button {
          margin-right: 5px;
          padding: 5px 10px;
          border: none;
          cursor: pointer;
        }
        td button:disabled {
          background-color: #6c757d;
          cursor: not-allowed;
        }
        td button:first-child {
          background-color: #007bff;
          color: white;
        }
        td button:last-child {
          background-color: #dc3545;
          color: white;
        }
        td button:hover:not(:disabled) {
          opacity: 0.8;
        }
      `}</style>
        </div>
    );
};

export default AdminPage;
