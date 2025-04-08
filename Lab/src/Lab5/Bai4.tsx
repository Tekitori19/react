import { useState } from "react";
import { Button, Container, Form } from "react-bootstrap";
import { useForm } from "react-hook-form";
import axios from "axios";

function Bai4() {
    const [responseMessage, setResponseMessage] = useState("");
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm();
    const onSubmit = (data: any) => {
        axios
            .post("http://localhost:3000/posts", data)
            .then((_response) => {
                setResponseMessage("Bài viết đã được tạo thành công!");
                reset(); // Reset form sau khi gửi thành công 
            })
            .catch((_error) => {
                setResponseMessage("Có lỗi xảy ra khi gửi bài viết.");
            });
    };
    return (
        <Container className="mt-5">
            <Form onSubmit={handleSubmit(onSubmit)}>
                <Form.Group className="mb-3">
                    <Form.Label>Tiêu đề</Form.Label>
                    <Form.Control
                        type="text"
                        {...register("title", { required: "Tiêu đề không được để trống" })}
                    />
                    {errors.title && <p className="text-danger">{String(errors.title.message)}</p>}
                </Form.Group>
                <Form.Group className="mb-3">
                    <Form.Label>Nội dung</Form.Label>
                    <Form.Control
                        as="textarea"
                        {...register("body", { required: "Nội dung không được để trống" })}
                    />
                    {errors.body && <p className="text-danger">{String(errors.body.message)}</p>}
                </Form.Group>
                <Button variant="primary" type="submit">
                    Tạo bài viết
                </Button>
            </Form>
            {responseMessage && <p className="mt-3">{responseMessage}</p>}
        </Container>
    );
}
export default Bai4;
