import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'OShift — Competitive intelligence, continuously',
    description:
        'Every launch, price change and angry review your competitors produce is public. OShift collects it across web, social, video, ads, news and reviews, then returns scored opportunities with the evidence attached.',
    openGraph: {
        title: 'OShift — Competitive intelligence, continuously',
        description:
            'Scored opportunities with citations, not a firehose of mentions.',
        type: 'website',
    },
};

export default function LandingLayout({ children }: { children: React.ReactNode }) {
    // data-theme is pinned: the landing page is a dark-only marketing surface and
    // must not inherit the app's light theme from the user's saved preference.
    return <div data-theme="dark">{children}</div>;
}
