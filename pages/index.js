import fs from 'fs';
import path from 'path';
import Head from 'next/head';
import Script from 'next/script';

export async function getStaticProps() {
  const filePath = path.join(process.cwd(), 'public', 'base.html');
  const html = fs.readFileSync(filePath, 'utf8');
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  const body = bodyMatch ? bodyMatch[1] : '';
  return { props: { body } };
}

export default function Home({ body }) {
  return (
    <>
      <Head>
        <title>Exoplanet Transit Animation</title>
      </Head>
      <div dangerouslySetInnerHTML={{ __html: body }} />
      <Script type="module" src="/src/app.js" strategy="afterInteractive" />
    </>
  );
}
