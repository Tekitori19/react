import { useState } from "react";
import ProductItem, { ProductProps } from "./ProductItem";
import { Container, Table } from "react-bootstrap";
function ProductList() {
    const [products] = useState<ProductProps[]>([
        {
            id: 1,
            name: "Sản phẩm 1",
            image: "https://images.unsplash.com/photo-1741720253113-1bea4d5686a3?q=80&w=1374&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
            quantity: 10,
            status: "Còn hàng",
            price: 100000,
        },
        {
            id: 2,
            name: "Sản phẩm 2",
            image: "https://images.unsplash.com/photo-1741920852881-5284c70305bd?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
            status: "Hết hàng",
            quantity: 0,
            price: 200000,
        },
        {
            id: 3,
            name: "Sản phẩm 3",
            image: "https://images.unsplash.com/photo-1734004691776-d7f04732c174?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDF8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
            status: "Còn hàng",
            quantity: 5,
            price: 300000,
        }
    ])

    return (
        <Container className="mt-5">
            <h1 className="text-center">Danh sách sản phẩm</h1>
            <Table striped bordered hover>
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Tên sản phẩm</th>
                        <th>Ảnh</th>
                        <th>Số lượng</th>
                        <th>Tình trạng</th>
                        <th>Giá</th>
                    </tr>
                </thead>
                <tbody>
                    {products.map((product) => (
                        <ProductItem key={product.id} product={product} />
                    ))}
                </tbody>
            </Table>
        </Container >
    );
}
export default ProductList; 
