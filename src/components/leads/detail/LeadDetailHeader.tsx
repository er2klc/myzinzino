import { Button } from "@/components/ui/button";
import { Tables } from "@/integrations/supabase/types";
import { SendMessageDialog } from "@/components/messaging/SendMessageDialog";
import { useSettings } from "@/hooks/use-settings";
import { MessageSquare, Scan, ExternalLink, Check, AlertTriangle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Platform, getPlatformConfig, generateSocialMediaUrl } from "@/config/platforms";
import { Checkbox } from "@/components/ui/checkbox";

interface LeadDetailHeaderProps {
  lead: Tables<"leads"> & {
    platform: Platform;
  };
  onUpdateLead: (updates: Partial<Tables<"leads">>) => void;
}

export const LeadDetailHeader = ({ lead, onUpdateLead }: LeadDetailHeaderProps) => {
  const { settings } = useSettings();
  const [isScanning, setIsScanning] = useState(false);
  const currentTypes = lead.contact_type?.split(',').filter(Boolean) || [];
  const platformConfig = getPlatformConfig(lead.platform);
  const isDirectMessagePlatform = lead.platform === "Instagram" || lead.platform === "Facebook";

  const handleContactTypeChange = (type: string, checked: boolean) => {
    const types = new Set(currentTypes);
    if (checked) {
      types.add(type);
    } else {
      types.delete(type);
    }
    const newValue = Array.from(types).join(',');
    onUpdateLead({ contact_type: newValue || null });
  };

  const scanProfile = async () => {
    if (!lead.social_media_username || lead.platform === "Offline") return;
    setIsScanning(true);
    try {
      const response = await supabase.functions.invoke('scan-social-profile', {
        body: {
          leadId: lead.id,
          platform: lead.platform,
          username: lead.social_media_username
        },
      });

      if (response.error) throw response.error;

      toast.success(
        settings?.language === "en"
          ? "Profile scanned successfully! Check the AI Summary section for updates."
          : "Profil erfolgreich gescannt! Überprüfen Sie den KI-Zusammenfassungsbereich für Updates."
      );
    } catch (error) {
      console.error('Error scanning profile:', error);
      toast.error(
        settings?.language === "en"
          ? "Error scanning profile"
          : "Fehler beim Scannen des Profils"
      );
    } finally {
      setIsScanning(false);
    }
  };

  const displayUsername = lead.social_media_username?.replace(/^https?:\/\/[^\/]+\//, '');
  const profileUrl = generateSocialMediaUrl(lead.platform, lead.social_media_username || '');

  return (
    <div className="flex flex-col gap-4 p-6 border-b">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <h2 className="text-2xl font-semibold antialiased">{lead.name}</h2>
            <div className="flex items-center gap-2 mt-1">
              <platformConfig.icon className="h-4 w-4" />
              <span className="text-sm text-muted-foreground antialiased">{lead.platform}</span>
              {lead.platform !== "Offline" && (
                <>
                  {displayUsername ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex items-center gap-2 h-6"
                      onClick={() => window.open(profileUrl, '_blank')}
                    >
                      <span className="text-sm antialiased">{displayUsername}</span>
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  ) : (
                    <Alert variant="destructive" className="py-1 px-2">
                      <AlertTriangle className="h-3 w-3" />
                      <AlertDescription className="text-xs antialiased">
                        Kein Profil gefunden
                      </AlertDescription>
                    </Alert>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <SendMessageDialog
            lead={lead}
            trigger={
              <Button variant="outline" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                {isDirectMessagePlatform 
                  ? "✨ KI-Nachricht für Erstkontakt"
                  : settings?.language === "en" ? "Send Message" : "Nachricht senden"}
              </Button>
            }
          />
          {lead.platform !== "Offline" && (
            <Button
              variant="outline"
              onClick={scanProfile}
              disabled={isScanning || !lead.social_media_username}
              className="flex items-center gap-2"
            >
              <Scan className="h-4 w-4" />
              {isScanning 
                ? (settings?.language === "en" ? "Scanning..." : "Scannt...")
                : (settings?.language === "en" ? "Scan Profile" : "Profil scannen")}
            </Button>
          )}
        </div>
      </div>

      <div className="flex justify-end mt-2">
        <div className="flex items-center gap-6">
          <div className={`p-2 rounded-lg transition-colors ${
            currentTypes.includes("Partner") ? "bg-blue-100" : ""
          }`}>
            <div className="flex items-center">
              <Checkbox
                checked={currentTypes.includes("Partner")}
                onCheckedChange={(checked) => 
                  handleContactTypeChange("Partner", checked as boolean)
                }
                id="partner"
                className="mr-2"
              />
              <label 
                htmlFor="partner" 
                className="text-sm font-medium cursor-pointer antialiased"
              >
                Likely Partner
              </label>
            </div>
          </div>
          <div className={`p-2 rounded-lg transition-colors ${
            currentTypes.includes("Kunde") ? "bg-green-100" : ""
          }`}>
            <div className="flex items-center">
              <Checkbox
                checked={currentTypes.includes("Kunde")}
                onCheckedChange={(checked) => 
                  handleContactTypeChange("Kunde", checked as boolean)
                }
                id="kunde"
                className="mr-2"
              />
              <label 
                htmlFor="kunde" 
                className="text-sm font-medium cursor-pointer antialiased"
              >
                Likely Kunde
              </label>
            </div>
          </div>
        </div>
      </div>

      {lead.last_social_media_scan && (
        <div className="flex items-center justify-end gap-2 text-sm text-muted-foreground antialiased">
          <Check className="h-4 w-4 text-green-500" />
          Zuletzt gescannt: {new Date(lead.last_social_media_scan).toLocaleString()}
        </div>
      )}
    </div>
  );
};