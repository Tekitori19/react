import { useState } from "react";
import { Button, Container } from "react-bootstrap";
function Bai1() {
    const [message, setMessage] = useState("");
    const handleClick = (buttonNumber: number) => {
        setMessage(`Bạn đã nhấn vào nút số ${buttonNumber}`);
    };
    return (
        <Container className="text-center mt-5">
            <Button variant="primary" onClick={() => handleClick(1)} className="me-2">Nút 1</Button>
            <Button variant="secondary" onClick={() => handleClick(2)} className="me-2">Nút 2</Button>
            <Button variant="success" onClick={() => handleClick(3)}>Nút 3</Button>
            <p className="mt-3">{message}</p>
        </Container>
    );
}
export default Bai1; 
