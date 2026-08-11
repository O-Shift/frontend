import DashboardLoading from '@/components/DashboardLoading';

// DashboardLoading already mirrors this page's layout. It was written and never
// imported anywhere, so the dashboard fell back to a blank frame.
export default function Loading() {
    return <DashboardLoading />;
}
