import { Card, CardContent } from "@/components/ui/card";
import { Users } from "lucide-react";
import { TeamCard } from "./TeamCard";
import { Button } from "@/components/ui/button";
import { Team } from "@/integrations/supabase/types/teams";

interface TeamListProps {
  isLoading: boolean;
  teams: any[];
  onDelete: (teamId: string) => Promise<void>;
  onLeave: (teamId: string) => Promise<void>;
  onUpdateOrder: (teamId: string, newIndex: number) => Promise<void>;
}

export const TeamList = ({ 
  isLoading, 
  teams, 
  onDelete, 
  onLeave,
  onUpdateOrder 
}: TeamListProps) => {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!teams?.length) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center space-y-4 py-12">
            <Users className="h-12 w-12 text-muted-foreground" />
            <div className="text-center space-y-2">
              <h3 className="font-semibold">Keine Teams gefunden</h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                Erstellen Sie ein neues Team oder treten Sie einem bestehenden Team bei.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {teams.map((team: any, index: number) => (
        <div key={team.id} className="flex items-center gap-2">
          <div className="flex-1">
            <TeamCard
              team={team}
              teamStats={team.stats}
              onDelete={onDelete}
              onLeave={onLeave}
            />
          </div>
          <div className="flex flex-col gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onUpdateOrder(team.id, index - 1)}
              disabled={index === 0}
            >
              ↑
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onUpdateOrder(team.id, index + 1)}
              disabled={index === teams.length - 1}
            >
              ↓
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
};