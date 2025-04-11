import { createContext, ReactNode, useContext, useState } from "react";
import { Button, Container } from "react-bootstrap";

interface User {
    name: string;
}

interface UserContextType {
    user: User;
    changeName: (newName: string) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

interface UserProviderProps {
    children: ReactNode;
}

function UserProvider({ children }: UserProviderProps) {
    const [user, setUser] = useState<User>({ name: "John Doe" });
    const changeName = (newName: string) => {
        setUser({ name: newName });
    };
    return <UserContext.Provider value={{ user, changeName }}>{children}</UserContext.Provider>;
}

function Profile() {
    const context = useContext(UserContext);
    if (!context) {
        throw new Error("Profile must be used within a UserProvider");
    }
    const { user, changeName } = context;
    return (
        <Container className="mt-5 text-center">
            <h2>{`Hello, ${user.name}`}</h2>
            <Button variant="primary" onClick={() => changeName("Jane Doe")}>
                Change Name to Jane
            </Button>
        </Container>
    );
}

function Bai1() {
    return (
        <UserProvider>
            <Profile />
        </UserProvider>
    );
}

export default Bai1;

