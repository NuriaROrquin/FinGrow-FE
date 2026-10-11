import ReactMarkdown, { type Components, type ExtraProps } from "react-markdown"
import remarkGfm from "remark-gfm"
import { cn } from "@/lib/utils"

function omitNode<P extends ExtraProps>(props: P): Omit<P, "node"> {
  const rest: Omit<P, "node"> & ExtraProps = { ...props }
  delete rest.node
  return rest
}

const components: Components = {
  h1: (props) => <h1 {...omitNode(props)} className="mt-8 mb-4 text-3xl font-bold first:mt-0" />,
  h2: (props) => <h2 {...omitNode(props)} className="mt-8 mb-3 text-2xl font-bold first:mt-0" />,
  h3: (props) => <h3 {...omitNode(props)} className="mt-6 mb-2 text-xl font-semibold first:mt-0" />,
  h4: (props) => <h4 {...omitNode(props)} className="mt-4 mb-2 text-lg font-semibold" />,
  p: (props) => <p {...omitNode(props)} className="my-4 leading-7" />,
  a: (props) => (
    <a
      {...omitNode(props)}
      className="font-medium text-primary underline underline-offset-4"
      target="_blank"
      rel="noreferrer"
    />
  ),
  ul: (props) => <ul {...omitNode(props)} className="my-4 ml-6 list-disc space-y-2" />,
  ol: (props) => <ol {...omitNode(props)} className="my-4 ml-6 list-decimal space-y-2" />,
  li: (props) => <li {...omitNode(props)} className="leading-7" />,
  strong: (props) => <strong {...omitNode(props)} className="font-semibold text-foreground" />,
  blockquote: (props) => (
    <blockquote {...omitNode(props)} className="my-4 border-l-4 border-primary/40 pl-4 italic text-muted-foreground" />
  ),
  hr: (props) => <hr {...omitNode(props)} className="my-8 border-border" />,
  code: ({ className, ...props }) => (
    <code {...omitNode(props)} className={cn("rounded bg-muted px-1.5 py-0.5 font-mono text-sm", className)} />
  ),
  pre: (props) => (
    <pre
      {...omitNode(props)}
      className="my-4 overflow-x-auto rounded-lg bg-muted p-4 text-sm [&_code]:bg-transparent [&_code]:p-0"
    />
  ),
  table: (props) => (
    <div className="my-4 w-full overflow-x-auto">
      <table {...omitNode(props)} className="w-full border-collapse text-sm" />
    </div>
  ),
  th: (props) => <th {...omitNode(props)} className="border px-3 py-2 text-left font-semibold" />,
  td: (props) => <td {...omitNode(props)} className="border px-3 py-2" />,
}

export function ArticleMarkdown({ content }: { content: string }) {
  return (
    <article className="max-w-none text-base text-foreground/90">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </article>
  )
}
