import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import LearningPreferences from "./LearningPreferences.jsx";

export default function PreferencesOnboarding() {
  const { user } = useAuth();
  const navigate = useNavigate();
  if (user.learning_preferences?.neurodivergent_profiles?.length) return <Navigate to="/learning-space" replace />;
  return <LearningPreferences initialPreferences={null} onComplete={() => navigate("/learning-space", { replace: true })} />;
}
