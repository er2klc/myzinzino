import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "@supabase/auth-helpers-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ElevateHeader } from "@/components/elevate/ElevateHeader";
import { PlatformList } from "@/components/elevate/PlatformList";

const Elevate = () => {
  const navigate = useNavigate();
  const user = useUser();
  const queryClient = useQueryClient();

  const { data: platformsWithStats = [], isLoading } = useQuery({
    queryKey: ['platforms-with-stats'],
    queryFn: async () => {
      if (!user?.id) return [];
      
      try {
        const { data: platforms, error: platformsError } = await supabase
          .from('elevate_platforms')
          .select('*')
          .order('created_at', { ascending: false });

        if (platformsError) throw platformsError;

        // Process each platform sequentially to avoid response stream issues
        const results = await Promise.all(platforms.map(async (platform) => {
          const [{ data: teamAccess }, { data: userAccess }] = await Promise.all([
            supabase
              .from('elevate_team_access')
              .select('team_id')
              .eq('platform_id', platform.id),
            supabase
              .from('elevate_user_access')
              .select('*')
              .eq('platform_id', platform.id)
          ]);

          return {
            ...platform,
            stats: {
              totalTeams: teamAccess?.length || 0,
              totalUsers: userAccess?.length || 0
            }
          };
        }));

        return results;
      } catch (err: any) {
        console.error("Error in platform loading:", err);
        throw new Error("Fehler beim Laden der Plattformen");
      }
    },
    enabled: !!user,
  });

  const handleDeletePlatform = async (platformId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('elevate_platforms')
        .delete()
        .eq('id', platformId)
        .single();

      if (error) {
        console.error('Error deleting platform:', error);
        if (error.message?.includes('policy')) {
          toast.error("Sie haben keine Berechtigung, diese Plattform zu löschen");
        } else {
          toast.error("Fehler beim Löschen der Plattform");
        }
        return;
      }

      await queryClient.invalidateQueries({ queryKey: ['platforms-with-stats'] });
      toast.success('Plattform erfolgreich gelöscht');
    } catch (err: any) {
      console.error('Error in platform deletion:', err);
      toast.error("Fehler beim Löschen der Plattform");
    }
  };

  useEffect(() => {
    if (!user) {
      navigate("/auth");
    }
  }, [user, navigate]);

  if (!user) return null;

  const handleRefetch = async () => {
    await queryClient.invalidateQueries({ queryKey: ['platforms-with-stats'] });
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <ElevateHeader 
        onPlatformCreated={handleRefetch}
      />
      <PlatformList
        isLoading={isLoading}
        platforms={platformsWithStats}
        onDelete={handleDeletePlatform}
      />
    </div>
  );
};

export default Elevate;