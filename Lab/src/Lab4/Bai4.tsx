import { useState } from "react";
import { useForm } from "react-hook-form";
import { Form, Button, Container, Row, Col } from "react-bootstrap";

interface FormValues {
    name: string;
    image: string;
    quantity: number;
    price: number;
    status: string;
}

function Bai4() {
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<FormValues>();
    const [product, setProduct] = useState<FormValues>();
    const onSubmit = (data: FormValues) => {
        setProduct(data);
    };
    return (
        <Container className="mt-5">
            <h2>Thêm Sản phẩm</h2>
            <Form onSubmit={handleSubmit(onSubmit)}>
                <Form.Group className="mb-3">
                    <Form.Label>Tên sản phẩm</Form.Label>
                    <Form.Control
                        type="text"
                        placeholder="Nhập tên sản phẩm"
                        {...register("name", { required: "Tên sản phẩm không được để trống" })}
                    />
                    {errors.name && <p className="text-danger">{String(errors.name.message)}</p>}
                </Form.Group>
                <Form.Group className="mb-3">
                    <Form.Label>Ảnh</Form.Label>
                    <Form.Control
                        type="url"
                        placeholder="Nhập URL ảnh sản phẩm"
                        {...register("image", {
                            required: "Ảnh không được để trống",
                            pattern: {
                                value: /^(https?:\/\/.*\.(?:png|jpg|jpeg|gif|bmp))$/i,
                                message: "Định dạng ảnh không hợp lệ",
                            },
                        })}
                    />
                    {errors.image && <p className="text-danger">{String(errors.image.message)}</p>}
                </Form.Group>
                <Row>

                    <Col md={6}>
                        <Form.Group className="mb-3">
                            <Form.Label>Số lượng</Form.Label>
                            <Form.Control
                                type="number"
                                placeholder="Nhập số lượng"
                                {...register("quantity", {
                                    required: "Số lượng không được để trống",
                                    valueAsNumber: true,
                                    min: { value: 1, message: "Số lượng phải lớn hơn 0" },
                                })}
                            />
                            {errors.quantity && (
                                <p className="text-danger">{String(errors.quantity.message)}</p>
                            )}
                        </Form.Group>
                    </Col>
                    <Col md={6}>
                        <Form.Group className="mb-3">
                            <Form.Label>Giá (VND)</Form.Label>
                            <Form.Control
                                type="number"
                                placeholder="Nhập giá sản phẩm"
                                {...register("price", {
                                    required: "Giá không được để trống",
                                    valueAsNumber: true,
                                    min: { value: 1, message: "Giá phải lớn hơn 0" },


                                })}
                            />
                            {errors.price && <p className="text-danger">{String(errors.price.message)}</p>}
                        </Form.Group>
                    </Col>
                </Row>
                <Form.Group className="mb-3">
                    <Form.Label>Tình trạng</Form.Label>
                    <Form.Control as="select" {...register("status")}>
                        <option value="In Stock">Còn hàng</option>
                        <option value="Out of Stock">Hết hàng</option>
                    </Form.Control>
                </Form.Group>
                <Button variant="primary" type="submit">
                    Thêm sản phẩm
                </Button>
            </Form>
            {product && (
                <div className="mt-5">
                    <h3>Thông tin sản phẩm đã thêm:</h3>
                    <ul>
                        <li><strong>Tên sản phẩm:</strong> {product.name}</li>
                        <li><strong>Ảnh:</strong><img src={product.image} alt={product.name} width="100" /></li>
                        <li><strong>Số lượng:</strong> {product.quantity}</li>
                        <li><strong>Tình trạng:</strong> {product.status}</li>
                        <li><strong>Giá:</strong> {product.price} VND</li>
                    </ul>
                </div>
            )}
        </Container>
    );
}
export default Bai4;
