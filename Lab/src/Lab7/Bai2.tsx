import { createContext, ReactNode, useContext, useState } from "react";
import { Button, Container } from "react-bootstrap";

interface User {
    name: string;
    age: number;
}

interface UserContextType {
    user: User;
    changeName: (newName: string) => void;
    changeAge: (newAge: number) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

interface UserProviderProps {
    children: ReactNode;
}

function UserProvider({ children }: UserProviderProps) {
    const [user, setUser] = useState<User>({ name: "John Doe", age: 30 });
    const changeName = (newName: string) => {
        setUser({ ...user, name: newName });
    };
    const changeAge = (newAge: number) => {
        setUser({ ...user, age: newAge });
    };
    return (
        <UserContext.Provider value={{ user, changeName, changeAge }}>
            {children}
        </UserContext.Provider>
    );
}

function UserDetails() {
    const context = useContext(UserContext);
    if (!context) {
        throw new Error("UserDetails must be used within a UserProvider");
    }
    const { user, changeName, changeAge } = context;
    return (
        <Container className="mt-5 text-center">
            <h2>Name: {user.name}</h2>
            <h3>Age: {user.age}</h3>

            <Button variant="primary" onClick={() => changeName("Jane Smith")}>
                Change Name to Jane
            </Button>
            <Button variant="secondary" onClick={() => changeAge(25)} className="ms-2">
                Change Age to 25
            </Button>
        </Container>
    );
}

function Bai2() {
    return (
        <UserProvider>
            <UserDetails />
        </UserProvider>
    );
}

export default Bai2;
