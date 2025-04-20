// import './App.css'
// import 'bootstrap/dist/css/bootstrap.min.css';
// import Bai1 from './Lab7/Bai1'
// import Bai2 from './Lab7/Bai2'
// import Bai3 from './Lab7/Bai3'
// import Bai4 from './Lab7/Bai4';
//
// function App() {
//     return (
//         <>
//             <Bai1></Bai1>
//             <Bai2></Bai2>
//             <Bai3></Bai3>
//             <Bai4></Bai4>
//         </>
//     )
// }
//
// export default App

import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import ManageProduct from "./Lab8/labs/lab-10/ManageProduct";
import AddProduct from "./Lab8/labs/lab-10/AddProduct";
import EditProduct from "./Lab8/labs/lab-10/EditProduct";
function App() {
    return (

        <Router>
            <Routes>
                <Route path="/" element={<ManageProduct />} />
                <Route path="/add-product" element={<AddProduct />} />
                <Route path="/edit-product/:id" element={<EditProduct />} />
            </Routes>
        </Router>
    );
}
export default App;
