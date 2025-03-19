import { Button } from "react-bootstrap"
import Card from "react-bootstrap/esm/Card"

const Bai4 = () => {
    return (
        <Card style={{ width: '18rem' }}>
            <Card.Img variant="top" src="https://via.placeholder.com/150" />
            <Card.Body>
                <Card.Title>Card Title</Card.Title>
                <Card.Text>
                    Some quick example text to build on the card title and make up the bulk of the card's content.
                </Card.Text>
                <Button>See more</Button>
            </Card.Body>
        </Card>
    )
}

export default Bai4
