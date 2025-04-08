import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button, Container, Form } from "react-bootstrap";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function Authentication() {
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm();
    const navigate = useNavigate();
    const [isLogin, setIsLogin] = useState(true); // Dùng state để chuyển đổi giữa đăng nhập và đăng ký 
    // Xử lý đăng nhập 
    const handleLogin = async (data: any) => {
        try {
            const response = await axios.post("http://localhost:3000/login", data);
            if (response.data) {
                alert("Đăng nhập thành công!");
                navigate("/");
            }
        } catch (error) {
            alert("Đăng nhập thất bại.");
        }
    };
    // Xử lý đăng ký 
    const handleRegister = async (data: any) => {
        try {
            const response = await axios.post("http://localhost:3000/register", data);
            if (response.data) {
                alert("Đăng ký thành công!");
                setIsLogin(true); // Chuyển qua màn hình đăng nhập sau khi đăng ký thành công 
            }
        } catch (error) {

            alert("Đăng ký thất bại.");
        }
    };
    // Chọn phương thức đăng ký hoặc đăng nhập 
    const onSubmit = isLogin ? handleLogin : handleRegister;
    return (
        <Container className="mt-5">
            <h3>{isLogin ? "Đăng Nhập" : "Đăng Ký"}</h3>
            <Form onSubmit={handleSubmit(onSubmit)}>
                <Form.Group className="mb-3">
                    <Form.Label>Email</Form.Label>
                    <Form.Control
                        type="email"
                        placeholder="Nhập email"
                        {...register("email", {
                            required: "Email không được để trống",
                            pattern: {
                                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                                message: "Email không đúng định dạng",
                            },
                        })}
                    />
                    {errors.email && <p className="text-danger">{String(errors.email.message)}</p>}
                </Form.Group>
                <Form.Group className="mb-3">
                    <Form.Label>Mật khẩu</Form.Label>
                    <Form.Control
                        type="password"
                        placeholder="Nhập mật khẩu"
                        {...register("password", {
                            required: "Mật khẩu không được để trống",
                            minLength: { value: 6, message: "Mật khẩu phải có ít nhất 6 ký tự" },
                        })}
                    />
                    {errors.password && <p className="text-danger">{String(errors.password.message)}</p>}
                </Form.Group>
                <Button variant="primary" type="submit">
                    {isLogin ? "Đăng Nhập" : "Đăng Ký"}
                </Button>
            </Form>
            <Button variant="link" onClick={() => setIsLogin(!isLogin)} className="mt-3">
                {isLogin ? "Chưa có tài khoản? Đăng ký ngay" : "Đã có tài khoản? Đăng nhập"}
            </Button>
        </Container>
    );
}
export default Authentication; 
