import { Toast } from "react-bootstrap"

const Toas = ({ count }: { count: number }) => {
    return (
        <Toast>
            <Toast.Header>
                <img src="holder.js/20x20?text=%20" className="rounded me-2" alt="" />
                <strong className="me-auto">Bootstrap</strong>
                <small>11 mins ago</small>
            </Toast.Header>
            <Toast.Body>{count}</Toast.Body>
        </Toast>
    )
}

export default Toas
