import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "react-query";
import axios from "axios";
import { Form, Button, Container } from "react-bootstrap";
import { useNavigate, useParams } from "react-router-dom";

// Define the product type
interface Product {
    id?: string;
    name: string;
    price: string;
    quantity: string;
}

// Hàm lấy sản phẩm theo ID 
const fetchProductById = async (id: string): Promise<Product> => {
    const response = await axios.get(`http://localhost:5000/products/${id}`);
    return response.data;
};

// Hàm cập nhật sản phẩm 
const updateProduct = async (updatedProduct: Product): Promise<void> => {
    await axios.put(`http://localhost:5000/products/${updatedProduct.id}`, updatedProduct);
};

function EditProduct() {
    const [product, setProduct] = useState<Product>({ name: "", price: "", quantity: "" });
    const { id } = useParams<{ id: string }>();
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const { data, isLoading, error } = useQuery<Product, Error>(["product", id], () => fetchProductById(id!), {
        onSuccess: (data) => {
            setProduct(data);
        },
    });

    // Mutation cập nhật sản phẩm 
    const updateProductMutation = useMutation<void, Error, Product>(updateProduct, {
        onSuccess: () => {
            queryClient.invalidateQueries("products");
            navigate("/");
            alert("Sản phẩm đã được cập nhật");
        },
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setProduct({ ...product, [name]: value });
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        updateProductMutation.mutate(product);
    };

    if (isLoading) return <div>Đang tải...</div>;
    if (error) return <div>Lỗi: {error.message}</div>;

    return (
        <Container className="mt-5">
            <h2>Cập nhật sản phẩm</h2>
            <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                    <Form.Label>Tên sản phẩm</Form.Label>
                    <Form.Control
                        type="text"
                        name="name"
                        value={product.name}
                        onChange={handleChange}
                    />
                </Form.Group>
                <Form.Group className="mb-3">
                    <Form.Label>Giá</Form.Label>
                    <Form.Control
                        type="number"
                        name="price"
                        value={product.price}
                        onChange={handleChange}
                    />
                </Form.Group>
                <Form.Group className="mb-3">
                    <Form.Label>Số lượng</Form.Label>
                    <Form.Control
                        type="number"
                        name="quantity"
                        value={product.quantity}
                        onChange={handleChange}
                    />
                </Form.Group>
                <Button variant="primary" type="submit">
                    Cập nhật sản phẩm
                </Button>
            </Form>
        </Container>
    );
}

export default EditProduct;

