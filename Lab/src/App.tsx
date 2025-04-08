import './App.css'
import 'bootstrap/dist/css/bootstrap.min.css';
import Bai1 from './Lab6/Bai1'
import Bai2 from './Lab6/Bai2'
import Bai3 from './Lab6/Bai3'
import Authentication from './Lab6/Authentication'
import { BrowserRouter } from 'react-router-dom';

function App() {
    return (
        <>
            <Bai1></Bai1>
            <Bai2></Bai2>
            <Bai3></Bai3>
            <BrowserRouter>
                <Authentication></Authentication>
            </BrowserRouter>
        </>
    )
}

export default App
