import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="en">
      <Head />
      <body>
        <Main />
        <NextScript />
        {/* Add a script tag to ensure polyfills are loaded early */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if (typeof window !== 'undefined') {
                window.global = window;
                if (typeof global === 'undefined') {
                  window.global = window;
                }
              }
            `,
          }}
        />
      </body>
    </Html>
  )
}
