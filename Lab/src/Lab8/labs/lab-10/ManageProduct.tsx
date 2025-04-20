import { useQuery, useMutation, useQueryClient } from "react-query";
import axios from "axios";
import { Button, Table, Container } from "react-bootstrap";
import { Link } from "react-router-dom";

// Fetch sản phẩm 
const fetchProducts = async (): Promise<any[]> => {
    const response = await axios.get("http://localhost:5000/products");
    return response.data;
};

// Hàm xóa sản phẩm 
const deleteProduct = async (id: number): Promise<void> => {
    await axios.delete(`http://localhost:5000/products/${id}`);
};

interface Product {
    id: number;
    name: string;
    price: number;
    quantity: number;
}

function ManageProduct() {
    const queryClient = useQueryClient();
    // Fetch sản phẩm từ API 
    const { data: products, error, isLoading } = useQuery<Product[], Error>("products", fetchProducts);
    // Mutation xóa sản phẩm 
    const deleteProductMutation = useMutation<void, Error, number>(deleteProduct, {
        onSuccess: () => {
            queryClient.invalidateQueries("products");
            alert("Sản phẩm đã được xóa");
        },
    });
    const handleDelete = (id: number) => {
        deleteProductMutation.mutate(id);
    };
    if (isLoading) return <div>Đang tải...</div>;
    if (error) return <div>Lỗi: {error.message}</div>;
    return (
        <Container className="mt-5">
            <h2>Danh sách sản phẩm</h2>
            <Link to="/add-product">
                <Button variant="primary" className="mb-3">
                    Thêm sản phẩm
                </Button>
            </Link>
            <Table striped bordered hover>
                <thead>
                    <tr>
                        <th>Tên sản phẩm</th>
                        <th>Giá</th>
                        <th>Số lượng</th>
                        <th>Hành động</th>
                    </tr>
                </thead>
                <tbody>
                    {products?.map((prod) => (
                        <tr key={prod.id}>
                            <td>{prod.name}</td>
                            <td>{prod.price}</td>
                            <td>{prod.quantity}</td>
                            <td>
                                <Link to={`/edit-product/${prod.id}`}>
                                    <Button variant="warning" className="me-2">
                                        Sửa
                                    </Button>
                                </Link>
                                <Button variant="danger" onClick={() => handleDelete(prod.id)}>
                                    Xóa
                                </Button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </Table>
        </Container>
    );
}
export default ManageProduct;

