import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Clock, Heart, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/app/content/$slug")({
  head: () => ({ meta: [{ title: "Conteúdo" }] }),
  component: PostDetail,
});

type Post = {
  id: string; title: string; summary: string | null; content: string | null;
  cover_image_url: string | null; category: string | null; type: string;
  read_time_minutes: number | null; like_count: number | null;
};

function PostDetail() {
  const { slug } = Route.useParams();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("content_posts").select("*").eq("slug", slug).maybeSingle();
      setPost(data as Post | null);
      if (data) {
        await supabase.from("content_posts").update({ view_count: (data.view_count ?? 0) + 1 }).eq("id", data.id);
      }
      setLoading(false);
    })();
  }, [slug]);

  if (loading) return <div className="grid h-64 place-items-center text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /></div>;
  if (!post) return (
    <div className="space-y-4">
      <Link to="/app/content/feed" className="inline-flex items-center gap-2 text-sm text-muted-foreground"><ArrowLeft className="h-4 w-4" /> Voltar</Link>
      <p className="text-muted-foreground">Conteúdo não encontrado.</p>
    </div>
  );

  return (
    <article className="-mx-5 -mt-5 pb-6">
      {post.cover_image_url && (
        <div className="relative aspect-video w-full bg-[#F1F5F9]">
          <img src={post.cover_image_url} alt="" className="h-full w-full object-cover" />
          <Link to="/app/content/feed" className="absolute left-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-white/90 shadow-md backdrop-blur">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </div>
      )}
      <div className="space-y-4 px-5 pt-5">
        {!post.cover_image_url && (
          <Link to="/app/content/feed" className="inline-flex items-center gap-2 text-sm text-muted-foreground"><ArrowLeft className="h-4 w-4" /> Voltar</Link>
        )}
        <div className="flex items-center gap-2">
          {post.category && <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide" style={{ background: "var(--clinic-primary-light)", color: "var(--clinic-primary-dark)" }}>{post.category}</span>}
          {post.read_time_minutes && <span className="flex items-center gap-1 text-[11px] text-muted-foreground"><Clock className="h-3 w-3" /> {post.read_time_minutes} min</span>}
        </div>
        <h1 className="font-display text-[24px] font-bold leading-tight">{post.title}</h1>
        {post.summary && <p className="text-[14px] text-muted-foreground">{post.summary}</p>}
        <div className="prose prose-sm max-w-none whitespace-pre-wrap text-[14px] leading-relaxed text-foreground">
          {post.content}
        </div>
        <div className="flex items-center gap-1 border-t border-border pt-4 text-sm text-muted-foreground">
          <Heart className="h-4 w-4" /> {post.like_count ?? 0} curtidas
        </div>
      </div>
    </article>
  );
}
