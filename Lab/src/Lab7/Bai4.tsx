import React, { createContext, useReducer, useContext, useEffect, ReactNode } from "react";
import { Button, Container } from "react-bootstrap";
import axios from "axios";

interface User {
    name: string;
    email: string;
}

interface State {
    user: User | null;
}

interface Action {
    type: string;
    payload?: any;
}

interface UserContextProps {
    state: State;
    dispatch: React.Dispatch<Action>;
}

const UserContext = createContext<UserContextProps | undefined>(undefined);

const userReducer = (state: State, action: Action): State => {
    switch (action.type) {
        case "SET_USER":
            return { ...state, user: action.payload };
        default:
            return state;
    }
};

interface UserProviderProps {
    children: ReactNode;
}

function UserProvider({ children }: UserProviderProps) {
    const [state, dispatch] = useReducer(userReducer, { user: null });

    const fetchUser = async () => {
        try {
            const response = await axios.get(`https://jsonplaceholder.typicode.com/users/${Math.floor(Math.random() * 10) + 1}`);
            dispatch({ type: "SET_USER", payload: response.data });
        } catch (error) {
            console.error("Error fetching user data", error);
        }
    };

    useEffect(() => {
        fetchUser();
    }, []);

    return <UserContext.Provider value={{ state, dispatch }}>{children}</UserContext.Provider>;
}

function UserDetails() {
    const context = useContext(UserContext);
    if (!context) {
        throw new Error("UserDetails must be used within a UserProvider");
    }
    const { state, dispatch } = context;

    const handleUpdateClick = async () => {
        try {
            const response = await axios.get(`https://jsonplaceholder.typicode.com/users/${Math.floor(Math.random() * 10) + 1}`);
            dispatch({ type: "SET_USER", payload: response.data });
        } catch (error) {
            console.error("Error fetching user data", error);
        }
    };

    return (
        <Container className="mt-5 text-center">
            {state.user ? (
                <>
                    <h2>Name: {state.user.name}</h2>
                    <h3>Email: {state.user.email}</h3>
                    <Button variant="primary" onClick={handleUpdateClick}>Update Info</Button>
                </>
            ) : (
                <p>Loading user data...</p>
            )}
        </Container>
    );
}

function Bai4() {
    return (
        <UserProvider>
            <UserDetails />
        </UserProvider>
    );
}

export default Bai4;
