import { Badge } from "react-bootstrap";

export interface ProductProps {
    id: number,
    name: string,
    image: string,
    quantity: number,
    price: number,
    status: "Còn hàng" | "Hết hàng"
}

function ProductItem({ product }: { product: ProductProps }) {
    const formatPrice = (price: number) => {
        return new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
        }).format(price);
    };
    return (
        <tr>
            <td>{product.id}</td>
            <td>{product.name}</td>
            <td>
                <img src={product.image} alt={product.name} style={{ width: "100px" }} />
            </td>
            <td>{product.quantity}</td>
            <td>
                <Badge bg={product.status === "Còn hàng" ? "success" : "danger"} text="light">
                    {product.status}
                </Badge>
            </td>
            <td>{formatPrice(product.price)}</td>
        </tr>
    );
}
export default ProductItem;
