import { useState } from "react";
import { Button, Container } from "react-bootstrap";

function Bai2() {
    const [counter, setCounter] = useState(0);
    const [message, setMessage] = useState("");
    const handleIncrease = () => {
        setCounter(counter + 1);
        setMessage("Tăng");
    };
    const handleDecrease = () => {
        setCounter(counter - 1);
        setMessage("Giảm");
    };
    return (
        <Container className="text-center mt-5">
            <h1>Giá trị hiện tại: {counter}</h1>
            <p>Trạng thái: {message}</p>
            <Button variant="success" onClick={handleIncrease} className="me-2">
                Tăng giá trị
            </Button>
            <Button variant="danger" onClick={handleDecrease}>
                Giảm giá trị
            </Button>
        </Container>
    );
}
export default Bai2;
