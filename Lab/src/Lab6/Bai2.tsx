import { Button, Container } from "react-bootstrap";
import { Link, Route, BrowserRouter as Router, Routes } from "react-router-dom";

function Home() {
    return (
        <Container className="mt-5">
            <h3>Trang Chủ</h3>
            <Link to="about">
                <Button variant="primary">Đi đến About</Button>
            </Link>
        </Container>
    );
}
function About() {
    return (
        <Container className="mt-5">
            <h3>Giới thiệu</h3>
            <p>Đây là phần giới thiệu của ứng dụng.</p>
        </Container>
    );
}
function Bai2() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="about" element={<About />} />
            </Routes>
        </Router>
    );
}
export default Bai2;
