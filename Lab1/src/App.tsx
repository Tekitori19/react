import { useState } from 'react'
import Button from './components/Button'
import Accordion from './components/Accordion'
import './App.css'
import Toas from './components/Toast';
import NavBar from './components/NavBar';
import FormComponent from './components/Form';
import { Col, Container, Row } from 'react-bootstrap';
import Bai3 from './components/Bai3';
import Bai4 from './components/Bai4';

function App() {
    const [count, setCount] = useState<number>(0)
    const [show, setShow] = useState<boolean>(false)
    const handleShow = () => {
        setCount(count + 1)
        setShow(!show)
    }

    return (
        <>
            <NavBar></NavBar>
            <Bai3></Bai3>
            <Container>
                <Row>
                    {new Array(4).fill(0).map((_, _index) => {
                        return (
                            <Col>
                                <Bai4 />
                            </Col>
                        )
                    })}
                </Row>
            </Container>
            {show && <Toas count={count}></Toas >}
            <Button click={handleShow} />
            <Container>
                <Row>
                    <Col>
                        <Accordion></Accordion>
                    </Col>
                    <Col>
                        <FormComponent></FormComponent>
                    </Col>
                </Row>
            </Container>
        </>
    )
}

export default App
