import { useReducer } from "react";
import { Button, Container } from "react-bootstrap";

interface UserState {
    name: string;
    age: number;
}

interface Action {
    type: string;
    payload: any;
}

const userReducer = (state: UserState, action: Action): UserState => {
    switch (action.type) {
        case "CHANGE_NAME":
            return { ...state, name: action.payload };
        case "CHANGE_AGE":
            return { ...state, age: action.payload };
        default:
            return state;
    }
};

function Bai3() {
    const [user, dispatch] = useReducer(userReducer, { name: "John Doe", age: 30 });
    return (
        <Container className="mt-5 text-center">
            <h2>Name: {user.name}</h2>
            <h3>Age: {user.age}</h3>
            <Button variant="primary"
                onClick={() => dispatch({ type: "CHANGE_NAME", payload: "Jane Smith" })}
            >Change Name to Jane</Button>
            <Button variant="secondary"
                onClick={() => dispatch({ type: "CHANGE_AGE", payload: 25 })}
                className="ms-2"
            > Change Age to 25 </Button>
        </Container>
    );
}

export default Bai3;
