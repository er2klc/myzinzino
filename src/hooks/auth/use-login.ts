import { useState } from "react";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface LoginData {
  email: string;
  password: string;
}

export const useLogin = () => {
  const navigate = useNavigate();
  const supabase = useSupabaseClient();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<LoginData>({
    email: "",
    password: "",
  });

  const handleLogin = async () => {
    console.log('Starting signin process with email:', formData.email);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) {
        console.error('Signin error:', error);
        
        // Wenn der Benutzer nicht existiert, zur Registrierung weiterleiten
        if (error.message.includes('Invalid login credentials')) {
          const { data: userExists } = await supabase.auth.admin.getUserByEmail(formData.email);
          
          if (!userExists) {
            console.log('User does not exist, redirecting to registration');
            navigate('/auth', { 
              state: { 
                isSignUp: true, 
                email: formData.email 
              }
            });
            return false;
          }
          toast.error("Ungültige Anmeldedaten. Bitte überprüfen Sie Ihre E-Mail und Ihr Passwort.");
        } else {
          toast.error(error.message);
        }
        return false;
      }

      if (!data.user) {
        console.error('No user data returned from signin');
        toast.error("Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.");
        return false;
      }
      
      toast.success("Erfolgreich angemeldet! ✨");
      return true;
    } catch (error) {
      console.error('Unexpected error during login:', error);
      toast.error("Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.");
      return false;
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return {
    isLoading,
    setIsLoading,
    formData,
    handleLogin,
    handleInputChange,
  };
};