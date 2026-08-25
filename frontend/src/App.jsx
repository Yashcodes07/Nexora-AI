import { Routes, Route, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";
import Home from "./pages/Home.jsx";
import About from "./pages/About.jsx";
import Contact from "./pages/Contact.jsx";
import Login from "./pages/Login.jsx";
import Signup from "./pages/Signup.jsx";
import NotFound from "./pages/NotFound.jsx";
import Account from "./pages/Account.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import ForgotPassword from "./pages/ForgotPassword.jsx";
import ResetPassword from "./pages/ResetPassword.jsx";
import Settings from "./pages/Settings.jsx";
import PreferencesOnboarding from "./pages/PreferencesOnboarding.jsx";
import LearningSpace from "./pages/LearningSpace.jsx";
import Wellbeing from "./pages/Wellbeing.jsx";
import AIScheduler from "./pages/AIScheduler.jsx";
import VoiceControl from "./components/VoiceControl.jsx";

export default function App() {
  const location = useLocation();
  const appRoute = ["/learning-space", "/wellbeing", "/ai-scheduler", "/settings", "/account", "/preferences"].some((path) => location.pathname.startsWith(path));
  const protectedPage = (page) => <ProtectedRoute>{page}</ProtectedRoute>;
  return (
    <>
      <Navbar />
      {appRoute && <VoiceControl />}
      <main style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/learning-space" element={protectedPage(<LearningSpace />)} />
          <Route path="/wellbeing" element={protectedPage(<Wellbeing />)} />
          <Route path="/ai-scheduler" element={protectedPage(<AIScheduler />)} />
          <Route path="/settings" element={protectedPage(<Settings />)} />
          <Route path="/preferences" element={protectedPage(<PreferencesOnboarding />)} />
          <Route
            path="/account"
            element={
              <ProtectedRoute>
                <Account />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      {!appRoute && <Footer />}
    </>
  );
}
