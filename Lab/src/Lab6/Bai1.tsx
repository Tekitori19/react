import { BrowserRouter as Router, Route, Routes, Link } from "react-router-dom";
import { Container, Button } from "react-bootstrap";
function Home() {
    return (
        <Container className="mt-5">
            <h3>Trang Chủ</h3>

            <p>Chào mừng bạn đến với ứng dụng React!</p>
            <Link to="/post/1">
                <Button variant="primary">Xem bài viết 1</Button>
            </Link>
        </Container>
    );
}

function Post({ id }: any) {
    return (
        <Container className="mt-5">
            <h3>Bài viết {id}</h3>
            <p>Đây là nội dung chi tiết của bài viết {id}.</p>
            <Link to="/">
                <Button variant="secondary">Trở về trang chủ</Button>
            </Link>
        </Container>
    );
}

function Bai1() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/post/:id" element={<Post />} />
            </Routes>
        </Router>
    );
}

export default Bai1; 
