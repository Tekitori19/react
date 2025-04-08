import axios from "axios";
import { useEffect, useState } from "react";
import { Button, Container } from "react-bootstrap";
import { Post } from "./Bai2";


function Bai3() {
    const [postId, setPostId] = useState(1);
    const [post, setPost] = useState<Post>();
    useEffect(() => {
        // Fetch bài viết khi postId thay đổi 
        axios
            .get(`http://localhost:3000/posts/${postId}`)
            .then((response) => {
                setPost(response.data);
            })
            .catch((error) => {
                console.error("Có lỗi khi fetch dữ liệu:", error);
            });
    }, [postId]); // Chỉ gọi khi postId thay đổi
    return (
        <Container className="mt-5">
            <Button variant="primary" onClick={() => setPostId(postId + 1)}>
                Xem bài viết tiếp theo
            </Button>
            {
                post
                    ?
                    <>
                        <h3 className="mt-3">{post.title}</h3>
                        <p>{post.body}</p>
                    </>
                    : "There is no post with this id" // Nếu không có bài viết nào thì hiển thị thông báo
            }
        </Container>
    );
}
export default Bai3;
