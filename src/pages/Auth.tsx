import { AuthCard } from "@/components/auth/AuthCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { SocialLoginButtons } from "@/components/auth/SocialLoginButtons";

const Auth = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) throw error;

      if (data.user) {
        toast.success("Erfolgreich angemeldet!");
        navigate("/dashboard");
      }
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error(error.message || "Ein Fehler ist aufgetreten");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'apple') => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback/${provider}`,
        },
      });
      if (error) throw error;
    } catch (error: any) {
      console.error(`${provider} login error:`, error);
      toast.error(`Fehler beim ${provider}-Login`);
    }
  };

  return (
    <AuthCard
      title="Anmeldung"
      description="Melden Sie sich in Ihrem Konto an"
    >
      <form onSubmit={handleLogin} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">E-Mail</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="name@example.com"
            value={formData.email}
            onChange={handleInputChange}
            disabled={isLoading}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Passwort</Label>
          <Input
            id="password"
            name="password"
            type="password"
            placeholder="••••••••"
            value={formData.password}
            onChange={handleInputChange}
            disabled={isLoading}
            required
          />
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={isLoading}
        >
          {isLoading ? "Laden..." : "Anmelden"}
        </Button>

        <SocialLoginButtons
          onGoogleLogin={() => handleSocialLogin("google")}
          onAppleLogin={() => handleSocialLogin("apple")}
          isLoading={isLoading}
        />

        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={() => navigate("/register")}
            className="text-sm text-muted-foreground hover:underline"
          >
            Noch kein Account? Hier registrieren
          </button>
        </div>
      </form>
    </AuthCard>
  );
};

export default Auth;