import { useState, useEffect } from "react";
import { Container, ListGroup } from "react-bootstrap";
import axios from "axios";

export interface Post {
    id: string;
    title: string;
    body: string;
}

function Bai2() {
    const [posts, setPosts] = useState<Post[]>([]);
    useEffect(() => {
        // Fetch dữ liệu từ API json-server 
        axios
            .get("http://localhost:3000/posts")
            .then((response) => {
                setPosts(response.data);
            })
            .catch((error) => {
                console.error("Có lỗi khi fetch dữ liệu:", error);
            });
    }, []); // Mảng rỗng để chỉ gọi khi component mount 
    return (
        <Container className="mt-5">
            <h3>Danh sách bài viết</h3>
            <ListGroup>
                {posts.map((post) => (
                    <ListGroup.Item key={post.id}>
                        <h5>{post.title}</h5>
                        <p>{post.body}</p>
                    </ListGroup.Item>
                ))}
            </ListGroup>
        </Container>
    );
}
export default Bai2; 
