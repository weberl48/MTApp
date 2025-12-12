import { Toaster } from 'sonner'

export default function PortalRootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      {children}
      <Toaster position="top-right" richColors />
    </>
  )
}
