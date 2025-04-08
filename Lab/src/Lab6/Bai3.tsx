import { Button, Container, Form } from "react-bootstrap";
import {
    Link,
    Route,
    BrowserRouter as Router,
    Routes,
    useNavigate,
    useParams,
    useSearchParams,
} from "react-router-dom";

function Home() {
    const [searchParams, setSearchParams] = useSearchParams();
    const searchTerm = searchParams.get("search") || "";
    const navigate = useNavigate();
    const handleSearch = (e: any) => {
        e.preventDefault();
        const query = e.target.search.value;
        setSearchParams({ search: query });
        navigate(`/?search=${query}`);
    };
    return (
        <Container className="mt-5">
            <h3>Trang Chủ</h3>
            <Form onSubmit={handleSearch}>
                <Form.Control
                    type="text"
                    name="search"
                    defaultValue={searchTerm}
                    placeholder="Tìm kiếm..."
                />
                <Button type="submit" variant="primary" className="mt-3">


                    Tìm kiếm
                </Button>
            </Form>
            <p>Từ khóa tìm kiếm: {searchTerm}</p>
        </Container>
    );
}
function SearchResults() {
    const { searchTerm } = useParams();
    return (
        <Container className="mt-5">
            <h3>Kết quả tìm kiếm cho "{searchTerm}"</h3>
            <p>Hiển thị kết quả tìm kiếm cho từ khóa {searchTerm}</p>
            <Link to="/">
                <Button variant="secondary">Trở về</Button>
            </Link>
        </Container>
    );
}
function Bai3() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="search/:searchTerm" element={<SearchResults />} />
            </Routes>
        </Router>
    );
}
export default Bai3;
