import type { Metadata } from 'next';
import './workspaces.css';

export const metadata: Metadata = {
  title: 'Workspaces - OShift',
  description: 'Choose which OShift workspace to open',
};

export default function WorkspacesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
