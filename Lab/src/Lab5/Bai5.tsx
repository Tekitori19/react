import { useState, useEffect } from "react";
import { Button, Container, Form } from "react-bootstrap";
import { useForm } from "react-hook-form";
import axios from "axios";

function Bai4() {
    const [postData, setPostData] = useState({});
    const [postId, setPostId] = useState(1);
    const [responseMessage, setResponseMessage] = useState("");
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm();
    useEffect(() => {
        // Fetch dữ liệu bài viết khi ID thay đổi 
        axios
            .get(`http://localhost:3000/posts/${postId}`)
            .then((response) => {
                setPostData(response.data);

                reset(response.data); // Reset form khi dữ liệu bài viết được fetch 
            })
            .catch((error) => {
                console.error("Có lỗi khi fetch dữ liệu:", error);
            });
    }, [postId, reset]);
    const handleUpdate = (data: any) => {
        axios
            .put(`http://localhost:3000/posts/${postId}`, data)
            .then((_response) => {
                setResponseMessage("Bài viết đã được cập nhật thành công!");
            })
            .catch((_error) => {
                setResponseMessage("Có lỗi khi cập nhật bài viết.");
            });
    };
    const handleDelete = () => {
        axios
            .delete(`http://localhost:3000/posts/${postId}`)
            .then((_response) => {
                setResponseMessage("Bài viết đã được xóa thành công!");
            })
            .catch((_error) => {
                setResponseMessage("Có lỗi khi xóa bài viết.");
            });
    };
    return (
        <Container className="mt-5">
            <Form onSubmit={handleSubmit(handleUpdate)}>
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
                    Cập nhật bài viết
                </Button>
                <Button variant="danger" onClick={handleDelete} className="ms-2">
                    Xóa bài viết
                </Button>
            </Form>
            {responseMessage && <p className="mt-3">{responseMessage}</p>}
        </Container>
    );
}
export default Bai4; 
