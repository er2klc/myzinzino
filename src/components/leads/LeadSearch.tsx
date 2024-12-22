import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface LeadSearchProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export const LeadSearch = ({ searchQuery, setSearchQuery }: LeadSearchProps) => {
  return (
    <div className="relative flex-1">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        placeholder="Lead suchen..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="pl-10"
      />
    </div>
  );
};