import { useState } from "react";
import { useUser } from "@supabase/auth-helpers-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { CreatePlatformForm } from "./platform/CreatePlatformForm";
import { TeamAccessManager } from "./platform/TeamAccessManager";

interface CreatePlatformDialogProps {
  onPlatformCreated?: () => Promise<void>;
}

export const CreatePlatformDialog = ({ onPlatformCreated }: CreatePlatformDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const user = useUser();

  const resetState = () => {
    setName("");
    setDescription("");
    setSelectedTeams([]);
    setLogoFile(null);
    setLogoPreview(null);
    setIsLoading(false);
  };

  const handleCreate = async () => {
    if (!user) {
      toast.error("Sie müssen eingeloggt sein, um eine Plattform zu erstellen");
      return;
    }

    if (!name.trim()) {
      toast.error("Bitte geben Sie einen Namen ein");
      return;
    }

    setIsLoading(true);

    try {
      let logoUrl = null;

      if (logoFile) {
        const fileExt = logoFile.name.split('.').pop();
        const fileName = `${crypto.randomUUID()}.${fileExt}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('team-logos')
          .upload(fileName, logoFile, {
            upsert: true,
            contentType: logoFile.type
          });

        if (uploadError) {
          console.error('Logo upload error:', uploadError);
          throw uploadError;
        }

        const { data } = supabase.storage
          .from('team-logos')
          .getPublicUrl(fileName);

        logoUrl = data.publicUrl;
      }

      const { data: platform, error: platformError } = await supabase
        .from('elevate_platforms')
        .insert({
          name: name.trim(),
          description: description.trim() || null,
          created_by: user.id,
          logo_url: logoUrl
        })
        .select()
        .single();

      if (platformError) throw platformError;

      // Grant access to selected teams
      if (selectedTeams.length > 0) {
        const teamAccess = selectedTeams.map(teamId => ({
          platform_id: platform.id,
          team_id: teamId,
          granted_by: user.id
        }));

        const { error: accessError } = await supabase
          .from('elevate_team_access')
          .insert(teamAccess);

        if (accessError) throw accessError;
      }

      await onPlatformCreated?.();
      toast.success("Plattform erfolgreich erstellt");
      setIsOpen(false);
    } catch (error: any) {
      console.error('Error in platform creation:', error);
      toast.error("Fehler beim Erstellen der Plattform: " + (error.message || 'Unbekannter Fehler'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      resetState();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Plattform erstellen
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Neue Ausbildungsplattform erstellen</DialogTitle>
          <DialogDescription>
            Erstellen Sie eine neue Ausbildungsplattform und wählen Sie die Teams aus, die darauf Zugriff haben sollen.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6">
          <CreatePlatformForm
            name={name}
            setName={setName}
            description={description}
            setDescription={setDescription}
            logoFile={logoFile}
            setLogoFile={setLogoFile}
            logoPreview={logoPreview}
            setLogoPreview={setLogoPreview}
          />
          <TeamAccessManager
            selectedTeams={selectedTeams}
            setSelectedTeams={setSelectedTeams}
          />
        </div>
        <DialogFooter>
          <Button
            onClick={handleCreate}
            disabled={!name.trim() || isLoading}
          >
            {isLoading ? "Erstelle..." : "Plattform erstellen"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};