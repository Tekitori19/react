const Bai2 = () => {
    return (
        <>
            <h1>JSX với nhiều dòng</h1>
            <p>JSX giúp bạn dễ dàng tạo UI trực quan với cú pháp quen thuộc.</p>
            <table border={1} style={{ margin: "10px auto", width: "50%" }}>
                <thead>
                    <tr>
                        <th>Cột 1</th>
                        <th>Cột 2</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Hàng 1, Cột 1</td>
                        <td>Hàng 1, Cột 2</td>
                    </tr>
                    <tr>
                        <td>Hàng 2, Cột 1</td>
                        <td>Hàng 2, Cột 2</td>
                    </tr>
                    <tr>
                        <td>Hàng 3, Cột 1</td>
                        <td>Hàng 3, Cột 2</td>
                    </tr>
                </tbody>
            </table>
        </>
    )
}

export default Bai2
