import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import MainPage from './components/MainPage/MainPage';
import LoginPage from './components/LoginPage/LoginPage';
import DetailsPage from './components/DetailsPage/DetailsPage';
import RegisterPage from './components/RegisterPage/RegisterPage';
import ItemPage from './components/ItemPage/ItemPage';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import Navbar from './components/Navbar/Navbar';
import Profile from './components/Profile/Profile';
import { AppProvider } from './context/AppContext';
import AdminPanel from './components/AdminPanel/AdminPanel';
import Footer from './components/Footer/Footer';
// MyReservations page removed
import PurchaseHistory from './components/PurchaseHistory/PurchaseHistory';

function App() {

  return (
      <AppProvider>
        <Navbar/>
        <Routes>
          <Route path="/" element={<MainPage />} />
          <Route path="/app" element={<MainPage />} />
          <Route path='/app/profile' element={<Profile/>}/>
          <Route path="/app/item/:itemId" element={<DetailsPage/>} />
          <Route path="/app/login" element={<LoginPage/>} />
          <Route path="/app/register" element={<RegisterPage />} />
          <Route path="/app/addItem" element={<ItemPage />} />
          <Route path="/app/admin" element={<AdminPanel />} />
          {/* redirect legacy path to profile */}
          <Route path="/app/my-reservations" element={<Navigate to="/app/profile" replace />} />
          <Route path="/app/purchase-history" element={<PurchaseHistory />} />
        </Routes>
        <Footer />
        </AppProvider>
  );


}

export default App;
