import { Shield, Crown, Users } from "lucide-react";
import { type Tables } from "@/integrations/supabase/types";
import { useUser } from "@supabase/auth-helpers-react";

interface TeamCardContentProps {
  team: Tables<"teams"> & {
    stats?: {
      totalMembers: number;
      admins: number;
    };
  };
}

export const TeamCardContent = ({ team }: TeamCardContentProps) => {
  const user = useUser();
  const isTeamOwner = user?.id === team.created_by;

  return (
    <div className="flex-1">
      <h3 className="text-lg font-semibold">{team.name}</h3>
      {team.description && (
        <p className="text-sm text-muted-foreground">{team.description}</p>
      )}
      <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
        <span className="flex items-center gap-1">
          <Users className="h-4 w-4" />
          {team.stats?.totalMembers || 0}
        </span>
        <span>•</span>
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4" />
          <span>{team.stats?.admins || 0}</span>
          {isTeamOwner && (
            <span className="bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1">
              <Crown className="h-3 w-3" />
              Team Owner
            </span>
          )}
        </div>
      </div>
    </div>
  );
};