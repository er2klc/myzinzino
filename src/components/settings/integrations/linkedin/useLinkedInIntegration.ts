import { useState, useEffect } from "react";
import { useSettings } from "@/hooks/use-settings";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export function useLinkedInIntegration() {
  const { settings, updateSettings } = useSettings();
  const { toast } = useToast();
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [error, setError] = useState<string>();
  const redirectUri = `${window.location.origin}/auth/callback/linkedin`;
  const isConnected = settings?.linkedin_connected || false;

  useEffect(() => {
    const loadSavedCredentials = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const { data: platformAuth, error } = await supabase
          .from('platform_auth_status')
          .select('auth_token, refresh_token')
          .eq('platform', 'linkedin')
          .single();

        if (error) {
          console.error('Error loading LinkedIn credentials:', error);
          return;
        }

        if (platformAuth) {
          console.log("Loaded LinkedIn credentials:", { 
            hasAuthToken: !!platformAuth.auth_token,
            hasRefreshToken: !!platformAuth.refresh_token 
          });
          setClientId(platformAuth.auth_token || '');
          setClientSecret(platformAuth.refresh_token || '');
        }
      } catch (error) {
        console.error('Error in loadSavedCredentials:', error);
      }
    };

    loadSavedCredentials();
  }, []);

  const handleUpdateCredentials = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(undefined);
    
    if (!clientId || !clientSecret) {
      setError("Bitte füllen Sie alle Felder aus");
      toast({
        title: "Fehlende Eingaben",
        description: "Bitte füllen Sie alle Felder aus",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log("Saving LinkedIn credentials...");
      const { error: secretError } = await supabase
        .from('platform_auth_status')
        .upsert({
          user_id: (await supabase.auth.getUser()).data.user?.id,
          platform: 'linkedin',
          auth_token: clientId,
          refresh_token: clientSecret,
          is_connected: false,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,platform'
        });

      if (secretError) throw secretError;

      toast({
        title: "Erfolg",
        description: "LinkedIn Zugangsdaten wurden gespeichert",
      });
    } catch (error) {
      console.error('Error saving LinkedIn credentials:', error);
      setError("LinkedIn Zugangsdaten konnten nicht gespeichert werden");
      toast({
        title: "Fehler",
        description: "LinkedIn Zugangsdaten konnten nicht gespeichert werden",
        variant: "destructive",
      });
    }
  };

  const connectLinkedIn = async () => {
    try {
      setError(undefined);
      
      if (!clientId || !clientSecret) {
        setError("Bitte speichern Sie zuerst Ihre LinkedIn Zugangsdaten");
        toast({
          title: "Fehler",
          description: "Bitte speichern Sie zuerst Ihre LinkedIn Zugangsdaten",
          variant: "destructive",
        });
        return;
      }

      console.log("Starting LinkedIn OAuth flow with:", { 
        clientId,
        redirectUri 
      });

      // OpenID Connect Scopes verwenden
      const scope = "openid profile email w_member_social";
      const state = Math.random().toString(36).substring(7);
      
      localStorage.setItem("linkedin_oauth_state", state);
      
      const linkedInAuthUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}&scope=${encodeURIComponent(scope)}`;
      
      window.location.href = linkedInAuthUrl;
    } catch (error) {
      console.error("Error connecting to LinkedIn:", error);
      setError("Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.");
      toast({
        title: "Fehler bei der LinkedIn-Verbindung",
        description: "Bitte versuchen Sie es später erneut",
        variant: "destructive",
      });
    }
  };

  const copyRedirectUri = () => {
    navigator.clipboard.writeText(redirectUri);
    toast({
      title: "Kopiert!",
      description: "Redirect URI wurde in die Zwischenablage kopiert",
    });
  };

  return {
    clientId,
    setClientId,
    clientSecret,
    setClientSecret,
    redirectUri,
    isConnected,
    error,
    handleUpdateCredentials,
    connectLinkedIn,
    copyRedirectUri,
  };
}