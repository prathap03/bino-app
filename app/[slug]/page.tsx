// app/[slug]/page.tsx

import path from 'path';
import fs from 'fs/promises';
import { notFound } from 'next/navigation';

import ImageBlock from '../components/ImageBlock';
import TextSection from '../components/TextSection';
import Card from '../components/Card';
import CTA from '../components/CTA';
import StatsBox from '../components/StatsBox';

export const dynamic = 'force-dynamic'; // Ensure it's dynamic

const componentsMap = {
  ImageBlock,
  TextSection,
  Card,
  CTA,
  StatsBox,
};

type Props = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function Page({ params }: Props) {
  // Await the params before using them
  const { slug } = await params;
  const filePath = path.join(process.cwd(), 'app', 'generated', `${slug}.json`);

  let pageData;
  try {
    const json = await fs.readFile(filePath, 'utf8');
    pageData = JSON.parse(json);
  } catch (err) {
    return notFound(); // If file not found, show 404
  }

  return (
    <main className="flex flex-col gap-8 px-4 py-6 md:px-10 max-w-screen-xl mx-auto">
      {pageData?.components?.map((block: any, i: number) => {
        const Component = componentsMap[block.type as keyof typeof componentsMap];
        if (!Component) return null;
        return <Component key={i} {...block.props} />;
      })}
    </main>
  );
}