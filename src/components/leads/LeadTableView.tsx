import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Star } from "lucide-react";
import { Tables } from "@/integrations/supabase/types";

interface LeadTableViewProps {
  leads: Tables<"leads">[];
}

export const LeadTableView = ({ leads }: LeadTableViewProps) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[30px]"></TableHead>
          <TableHead>Name</TableHead>
          <TableHead>Plattform</TableHead>
          <TableHead>Phase</TableHead>
          <TableHead>Letzte Aktion</TableHead>
          <TableHead>Branche</TableHead>
          <TableHead className="w-[50px]"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {leads.map((lead) => (
          <TableRow key={lead.id}>
            <TableCell>
              <Button variant="ghost" size="icon" className="h-4 w-4">
                <Star className="h-4 w-4" />
              </Button>
            </TableCell>
            <TableCell className="font-medium">{lead.name}</TableCell>
            <TableCell>{lead.platform}</TableCell>
            <TableCell>
              <span
                className={`px-2 py-1 rounded-full text-xs ${
                  lead.phase === "initial_contact"
                    ? "bg-yellow-100 text-yellow-800"
                    : lead.phase === "follow_up"
                    ? "bg-blue-100 text-blue-800"
                    : "bg-green-100 text-green-800"
                }`}
              >
                {lead.phase === "initial_contact"
                  ? "Erstkontakt"
                  : lead.phase === "follow_up"
                  ? "Follow-up"
                  : "Abschluss"}
              </span>
            </TableCell>
            <TableCell>
              {lead.last_action_date
                ? new Date(lead.last_action_date).toLocaleDateString()
                : "-"}
            </TableCell>
            <TableCell>{lead.industry}</TableCell>
            <TableCell>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>Details anzeigen</DropdownMenuItem>
                  <DropdownMenuItem>Nachricht senden</DropdownMenuItem>
                  <DropdownMenuItem>Phase ändern</DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive">
                    Löschen
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};