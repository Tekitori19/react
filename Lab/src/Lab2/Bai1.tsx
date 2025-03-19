interface IPerson {
    firstName: string;
    lastName: string;
}

const Bai1 = () => {
    const person: IPerson = {
        firstName: "Phan",
        lastName: "Dương Định",
    };
    return (
        <div>
            <h1>Chào mừng đến với Lab 2</h1>
            <p>Tổng của 5 + 3 là: {5 + 3}</p>
            <p>Họ và tên: {person.firstName + " " + person.lastName}</p>
        </div>
    )
}

export default Bai1
