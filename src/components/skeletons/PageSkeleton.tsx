import Skeleton from '@/components/Skeleton';

/**
 * The shared route-level loading shell.
 *
 * Two separate windows leave a page with nothing drawn, and this component is
 * deliberately used for both so the reader never sees one replaced by the other:
 *
 *  1. navigation -> mount. The App Router holds the old page on screen until the
 *     next route's chunk arrives, so a click reads as a freeze. A `loading.tsx`
 *     exporting this component turns that into an immediate response.
 *  2. mount -> data. Every page here is a Client Component that fetches after
 *     hydration, so the shell paints and then waits on the API. That window is
 *     the multi-second one, and `loading.tsx` does not cover it — only the page's
 *     own `loading` branch does.
 *
 * Rendering the same shell in both places is the point. A route-level skeleton
 * that hands over to a blank page just moves the blank a few hundred ms later.
 *
 * Geometry tracks `.page-container` / `.page-inner` (globals.css:530,547) so the
 * real content lands where the placeholder was instead of jumping.
 */
export type PageSkeletonVariant = 'grid' | 'rows' | 'detail' | 'canvas';

export default function PageSkeleton({
    variant = 'rows',
    /** Cards for 'grid', rows for 'rows'. Ignored by the other variants. */
    count,
    /** Omit on pages whose real header is drawn before the fetch resolves. */
    showHeader = true,
}: {
    variant?: PageSkeletonVariant;
    count?: number;
    showHeader?: boolean;
}) {
    return (
        <div className="page-container">
            <div className="page-inner">
                {showHeader && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <Skeleton variant="line" width="260px" height={30} />
                        <Skeleton variant="line-sm" width="420px" />
                    </div>
                )}
                <PageSkeletonBody variant={variant} count={count} />
            </div>
        </div>
    );
}

function PageSkeletonBody({
    variant,
    count,
}: {
    variant: PageSkeletonVariant;
    count?: number;
}) {
    if (variant === 'canvas') {
        // Partnerships draws a full-bleed graph, so a card grid would be a lie
        // about what is coming. One large surface plus the toolbar it carries.
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, flex: 1 }}>
                <div style={{ display: 'flex', gap: 12 }}>
                    <Skeleton variant="card" width={140} height={36} />
                    <Skeleton variant="card" width={140} height={36} />
                    <Skeleton variant="card" width={96} height={36} />
                </div>
                <Skeleton variant="card" height={520} />
            </div>
        );
    }

    if (variant === 'detail') {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                    <Skeleton variant="circle" size={72} />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
                        <Skeleton variant="line" width="240px" height={26} />
                        <Skeleton variant="line-sm" width="180px" />
                    </div>
                </div>
                <div style={{ display: 'flex', gap: 16 }}>
                    {[0, 1, 2, 3].map(i => (
                        <Skeleton key={i} variant="card" height={96} style={{ flex: 1 }} />
                    ))}
                </div>
                <Skeleton variant="chart" height={280} />
                <div style={{ display: 'flex', gap: 16 }}>
                    <Skeleton variant="card" height={220} style={{ flex: 2 }} />
                    <Skeleton variant="card" height={220} style={{ flex: 1 }} />
                </div>
            </div>
        );
    }

    if (variant === 'grid') {
        return (
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                    gap: 24,
                }}
            >
                {Array.from({ length: count ?? 6 }).map((_, i) => (
                    <Skeleton key={i} variant="card" height={260} />
                ))}
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {Array.from({ length: count ?? 5 }).map((_, i) => (
                <Skeleton key={i} variant="card" height={80} />
            ))}
        </div>
    );
}
