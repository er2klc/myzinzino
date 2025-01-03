import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export interface RegistrationData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  phoneNumber: string;
  language: string;
}

export const useRegistration = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [registrationStep, setRegistrationStep] = useState(1);
  const [formData, setFormData] = useState<RegistrationData>({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phoneNumber: "",
    language: "Deutsch",
  });

  const handleRegistration = async () => {
    try {
      console.log("Starting registration process with email:", formData.email);
      
      // Create the user account with display_name in metadata
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            display_name: formData.name, // This will be used by the trigger
            full_name: formData.name,
            phoneNumber: formData.phoneNumber,
          },
        },
      });

      if (signUpError) {
        console.error('Registration error:', signUpError);
        if (signUpError.message.includes('already registered')) {
          toast.error("Diese E-Mail-Adresse ist bereits registriert. Bitte verwenden Sie eine andere E-Mail-Adresse.");
        } else {
          toast.error(signUpError.message);
        }
        return false;
      }

      if (!authData.user) {
        toast.error("Fehler bei der Registrierung");
        return false;
      }

      // Create initial settings with phone number
      const { error: settingsError } = await supabase
        .from('settings')
        .insert({
          user_id: authData.user.id,
          language: formData.language,
          whatsapp_number: formData.phoneNumber,
          name: formData.name,
        });

      if (settingsError) {
        console.error('Settings creation error:', settingsError);
        toast.error("Fehler beim Erstellen der Benutzereinstellungen");
        return false;
      }

      toast.success("Registrierung erfolgreich! Bitte bestätigen Sie Ihre E-Mail-Adresse.");
      return true;
    } catch (error: any) {
      console.error('Registration error:', error);
      toast.error(error.message || "Ein unerwarteter Fehler ist aufgetreten");
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
    registrationStep,
    setRegistrationStep,
    formData,
    handleRegistration,
    handleInputChange,
    setFormData,
  };
};