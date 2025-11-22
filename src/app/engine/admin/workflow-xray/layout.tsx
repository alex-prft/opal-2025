import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'OPAL Workflow X-ray | OSA Admin',
  description: 'Quick view of OPAL workflow status and results page readiness for demo confidence',
};

export default function WorkflowXrayLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
    </>
  );
}