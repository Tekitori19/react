import { useState } from "react";
import { Button, Container } from "react-bootstrap";

function Bai1() {
    const [count, setCount] = useState(0);
    return (
        <Container className="text-center mt-5">
            <h1>Số lần nhấn nút: {count}</h1>
            <Button variant="primary" onClick={() => setCount(count + 1)}>
                Tăng giá trị
            </Button>
        </Container>
    );
}

export default Bai1; 
