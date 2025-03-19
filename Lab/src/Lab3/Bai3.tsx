import { useState } from "react";
import { Button, Alert } from "react-bootstrap";
function Bai3() {
    const [show, setShow] = useState(true);
    return (
        <div className="text-center mt-5">
            {show && <Alert variant="info">Hiển thị nội dung</Alert>}
            <Button onClick={() => setShow(!show)} variant="primary">
                {show ? "Ẩn" : "Hiển thị"}
            </Button>
        </div>
    );
}
export default Bai3; 
