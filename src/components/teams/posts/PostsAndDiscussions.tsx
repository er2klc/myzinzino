import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { MessageSquare, ChevronRight, Megaphone, Lightbulb } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";

interface PostsAndDiscussionsProps {
  categories: any[];
  teamId: string;
}

export function PostsAndDiscussions({ categories, teamId }: PostsAndDiscussionsProps) {
  const navigate = useNavigate();

  const getCategoryIcon = (name: string) => {
    // Simple logic to assign icons based on category name
    if (name.toLowerCase().includes('ankündigung')) return <Megaphone className="h-8 w-8" />;
    if (name.toLowerCase().includes('idee')) return <Lightbulb className="h-8 w-8" />;
    return <MessageSquare className="h-8 w-8" />;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {categories.map((category) => {
        const topPosts = category.team_posts
          ?.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 3) || [];

        const totalComments = topPosts.reduce((acc: number, post: any) => 
          acc + (post.team_post_comments?.[0]?.count || 0), 0
        );

        return (
          <Card 
            key={category.id} 
            className="group hover:shadow-lg transition-all duration-200 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border-0 shadow-md"
          >
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-primary/10 rounded-xl">
                  {getCategoryIcon(category.name)}
                </div>
                <div>
                  <h3 className="text-xl font-semibold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                    {category.name}
                  </h3>
                  {category.description && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {category.description}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {totalComments > 0 && (
                  <span className="bg-primary/20 text-primary text-xs px-2 py-1 rounded-full">
                    {totalComments} Kommentare
                  </span>
                )}
                <button
                  onClick={() => navigate(`category/${category.slug}`)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-accent rounded-full"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </CardHeader>
            <CardContent>
              {topPosts.length > 0 ? (
                <div className="space-y-3">
                  {topPosts.map((post: any) => (
                    <div
                      key={post.id}
                      onClick={() => navigate(`category/${category.slug}`)}
                      className="flex items-start justify-between p-3 rounded-xl hover:bg-white dark:hover:bg-gray-800 transition-colors cursor-pointer shadow-sm"
                    >
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium truncate">{post.title}</h4>
                        <div className="text-sm text-muted-foreground mt-1">
                          {formatDistanceToNow(new Date(post.created_at), {
                            addSuffix: true,
                            locale: de,
                          })}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground ml-4">
                        <MessageSquare className="h-4 w-4" />
                        <span className="text-sm">{post.team_post_comments?.[0]?.count || 0}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-8 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
                  <p>Noch keine Beiträge in dieser Kategorie</p>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}