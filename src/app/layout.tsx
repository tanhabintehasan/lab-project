import '@/app/globals.css';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" translate="no" className="notranslate" suppressHydrationWarning>
      <head>
        {/* Prevent Google Translate and other translation extensions from running */}
        <meta name="google" content="notranslate" />
        {/* Content-Security-Policy to block translate-pa.googleapis.com */}
        <meta
          httpEquiv="Content-Security-Policy"
          content="default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; connect-src 'self' https:; img-src 'self' data: https: blob:; style-src 'self' 'unsafe-inline'; font-src 'self'; frame-src 'self'; object-src 'none'; base-uri 'self';"
        />
      </head>
      <body suppressHydrationWarning className="notranslate">
        {children}
      </body>
    </html>
  );
}
