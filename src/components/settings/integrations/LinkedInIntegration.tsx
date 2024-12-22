import React from "react";
import { useSettings } from "@/hooks/use-settings";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle, XCircle, Linkedin, Key } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";

export function LinkedInIntegration() {
  const { settings, updateSettings } = useSettings();
  const { toast } = useToast();
  const redirectUri = `${window.location.origin}/auth/callback/linkedin`;
  const isConnected = settings?.linkedin_connected || false;

  const handleUpdateCredentials = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const clientId = formData.get('linkedin_client_id') as string;
    const clientSecret = formData.get('linkedin_client_secret') as string;

    if (!clientId || !clientSecret) {
      toast({
        title: "Fehlende Eingaben",
        description: "Bitte füllen Sie alle Felder aus",
        variant: "destructive",
      });
      return;
    }

    try {
      // Store credentials in platform_auth_status table
      const { error: secretError } = await supabase.functions.invoke('update-linkedin-secrets', {
        body: { clientId, clientSecret }
      });

      if (secretError) throw secretError;

      toast({
        title: "Erfolg",
        description: "LinkedIn Zugangsdaten wurden gespeichert",
      });
    } catch (error) {
      console.error('Error saving LinkedIn credentials:', error);
      toast({
        title: "Fehler",
        description: "LinkedIn Zugangsdaten konnten nicht gespeichert werden",
        variant: "destructive",
      });
    }
  };

  const connectLinkedIn = async () => {
    try {
      // Get LinkedIn credentials from platform_auth_status
      const { data: platformAuth, error: platformError } = await supabase
        .from('platform_auth_status')
        .select('auth_token')
        .eq('platform', 'linkedin')
        .single();

      if (platformError) throw new Error('Could not get LinkedIn credentials');
      if (!platformAuth?.auth_token) throw new Error('LinkedIn Client ID not found');

      const clientId = platformAuth.auth_token;
      const scope = "r_liteprofile r_emailaddress w_member_social";
      const state = Math.random().toString(36).substring(7);
      
      localStorage.setItem("linkedin_oauth_state", state);
      
      const linkedInAuthUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}&scope=${encodeURIComponent(scope)}`;
      
      window.location.href = linkedInAuthUrl;
    } catch (error) {
      console.error("Error connecting to LinkedIn:", error);
      toast({
        title: "Fehler bei der LinkedIn-Verbindung",
        description: "Bitte versuchen Sie es später erneut",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Linkedin className="h-6 w-6 text-[#0A66C2]" />
          <h3 className="text-lg font-medium">LinkedIn Integration</h3>
          {isConnected ? (
            <CheckCircle className="h-5 w-5 text-green-500" />
          ) : (
            <XCircle className="h-5 w-5 text-red-500" />
          )}
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant={isConnected ? "outline" : "default"}>
              {isConnected ? "Einstellungen" : "Verbinden"}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>LinkedIn Integration Einrichten</DialogTitle>
              <DialogDescription>
                Geben Sie Ihre LinkedIn API Zugangsdaten ein:
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleUpdateCredentials} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="linkedin_client_id">LinkedIn Client ID</Label>
                <div className="flex gap-2">
                  <Key className="h-4 w-4 mt-3 text-muted-foreground" />
                  <Input
                    id="linkedin_client_id"
                    name="linkedin_client_id"
                    placeholder="77xxxxxxxxxxxxx"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="linkedin_client_secret">LinkedIn Client Secret</Label>
                <div className="flex gap-2">
                  <Key className="h-4 w-4 mt-3 text-muted-foreground" />
                  <Input
                    id="linkedin_client_secret"
                    name="linkedin_client_secret"
                    type="password"
                    placeholder="••••••••"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">Redirect URI</h4>
                <code className="block p-2 bg-muted rounded-md text-sm">
                  {redirectUri}
                </code>
                <p className="text-sm text-muted-foreground">
                  Fügen Sie diese URI zu Ihrer LinkedIn App hinzu
                </p>
              </div>
              <div className="flex gap-2">
                <Button type="submit" className="flex-1">
                  Zugangsdaten Speichern
                </Button>
                <Button type="button" onClick={connectLinkedIn} className="flex-1">
                  Mit LinkedIn verbinden
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <p className="text-sm text-muted-foreground">
        Verbinden Sie Ihr LinkedIn-Konto um Leads automatisch zu kontaktieren und
        Nachrichten zu versenden.
      </p>
    </Card>
  );
}