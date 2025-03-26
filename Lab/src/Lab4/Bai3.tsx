import { useState } from "react";
import { Form, Button, Container } from "react-bootstrap";

function Bai3() {
    const [formData, setFormData] = useState({ name: "", age: "" });
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };
    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        alert(`Tên: ${formData.name}, Tuổi: ${formData.age}`);
    };
    return (
        <Container className="mt-5">
            <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                    <Form.Label>Tên</Form.Label>
                    <Form.Control
                        type="text"
                        name="name"
                        placeholder="Nhập tên của bạn"
                        value={formData.name}
                        onChange={handleChange}
                    />
                </Form.Group>
                <Form.Group className="mb-3">
                    <Form.Label>Tuổi</Form.Label>
                    <Form.Control
                        type="number"
                        name="age"
                        placeholder="Nhập tuổi của bạn"
                        value={formData.age}
                        onChange={handleChange}
                    />
                </Form.Group>
                <Button variant="primary" type="submit">
                    Gửi
                </Button>
            </Form>
        </Container>
    );
}
export default Bai3;
