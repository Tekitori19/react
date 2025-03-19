import React from 'react'
import { Button } from 'react-bootstrap'

const Btn = ({ click }) => {
    return (
        <Button onClick={click}>toggle</Button>
    )
}

export default Btn
