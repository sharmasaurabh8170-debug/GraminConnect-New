import { BrowserRouter, Routes, Route } from "react-router-dom";
import FarmerDashboard from "./pages/FarmerDashboard";
import AddCrop from "./pages/AddCrop";
import Home from "./Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import CustomerDashboard from "./pages/CustomerDashboard";
function App() {
  return (
    <BrowserRouter>
      <Routes>

        <Route path="/" element={<Home />} />

        <Route path="/login" element={<Login />} />

        <Route path="/register" element={<Register />} />
        <Route
  path="/farmer-dashboard"
  element={<FarmerDashboard />}
/>

<Route
  path="/add-crop"
  element={<AddCrop />}
/>
<Route
  path="/customer-dashboard"
  element={<CustomerDashboard />}
/>

        <Route
          path="*"
          element={
            <div className="min-h-screen flex items-center justify-center">
              <h1 className="text-3xl font-bold text-green-700">
                404 - Page Not Found
              </h1>
            </div>
          }
        />
       

<Route
  path="/add-crop"
  element={<AddCrop />}
/>

      </Routes>
    </BrowserRouter>
  );
}

export default App;