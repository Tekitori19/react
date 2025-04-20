import React, { useState } from "react";
import { useMutation, useQueryClient } from "react-query";
import axios from "axios";
import { Form, Button, Container } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

// Hàm thêm sản phẩm 
const addProduct = async (newProduct) => {
    await axios.post("http://localhost:5000/products", newProduct);
};
function AddProduct() {
    const [product, setProduct] = useState({ name: "", price: "", quantity: "" });
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    // Mutation thêm sản phẩm 
    const addProductMutation = useMutation(addProduct, {
        onSuccess: () => {
            queryClient.invalidateQueries("products");
            navigate("/");
            alert("Sản phẩm đã được thêm");
        },
    });
    const handleChange = (e) => {
        const { name, value } = e.target;
        setProduct({ ...product, [name]: value });

    };
    const handleSubmit = (e) => {
        e.preventDefault();
        addProductMutation.mutate(product);
    };
    return (
        <Container className="mt-5">
            <h2>Thêm sản phẩm mới</h2>
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
                    Thêm sản phẩm
                </Button>
            </Form>
        </Container>
    );
}
export default AddProduct;
