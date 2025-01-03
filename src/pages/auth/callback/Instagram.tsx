import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const InstagramCallback = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        console.log('Starting Instagram callback handling...');
        
        const params = new URLSearchParams(window.location.search);
        const code = params.get("code");
        const state = params.get("state");
        const error = params.get("error");
        const storedState = localStorage.getItem("instagram_oauth_state");

        console.log('Received params:', { 
          code: code ? 'present' : 'missing', 
          state, 
          error,
          storedState,
          error_description: params.get("error_description"),
          full_url: window.location.href
        });

        if (error) {
          throw new Error(params.get("error_description") || "Authentication failed");
        }

        if (!code) {
          throw new Error("No code received from Instagram");
        }

        if (state !== storedState) {
          throw new Error("State mismatch. Possible CSRF attack.");
        }

        // Check session first
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          console.error('No active session found');
          toast({
            title: "Nicht eingeloggt",
            description: "Bitte melden Sie sich an und versuchen Sie es erneut.",
            variant: "destructive",
          });
          navigate("/auth");
          return;
        }

        console.log('Calling Instagram auth callback function...');
        
        const { data: response, error: functionError } = await supabase.functions.invoke('instagram-auth-callback', {
          body: {
            code,
            redirectUri: `${window.location.origin}/auth/callback/instagram`
          },
        });

        if (functionError) {
          console.error('Function error:', functionError);
          throw functionError;
        }

        console.log('Instagram auth callback response:', response);

        // Update platform_auth_status
        const { error: statusError } = await supabase
          .from('platform_auth_status')
          .upsert({
            user_id: session.user.id,
            platform: 'instagram',
            is_connected: true,
            access_token: response.access_token,
            auth_token: response.access_token,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'user_id,platform'
          });

        if (statusError) {
          console.error('Status update error:', statusError);
          throw statusError;
        }

        // Update settings
        const { error: settingsError } = await supabase
          .from('settings')
          .update({ 
            instagram_connected: true,
            instagram_auth_token: response.access_token,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', session.user.id);

        if (settingsError) {
          console.error('Settings update error:', settingsError);
          throw settingsError;
        }

        localStorage.removeItem("instagram_oauth_state");

        toast({
          title: "Instagram erfolgreich verbunden",
          description: "Ihre Instagram-Integration wurde erfolgreich eingerichtet.",
        });

        navigate("/settings");
      } catch (error) {
        console.error("Instagram auth callback error:", error);
        toast({
          title: "Fehler bei der Instagram-Verbindung",
          description: error.message,
          variant: "destructive",
        });
        navigate("/settings");
      }
    };

    handleCallback();
  }, [navigate, toast]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
    </div>
  );
};

export default InstagramCallback;