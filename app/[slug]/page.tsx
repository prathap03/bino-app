// app/[slug]/page.tsx
import { notFound } from 'next/navigation';
import { PrismaClient } from '@prisma/client'; // Import PrismaClient
import React from 'react'; // Ensure React is imported

// Recommended: Instantiate PrismaClient once in a dedicated file (e.g., lib/prisma.ts)
// to avoid creating new instances on every request in serverless environments.
// For example:
// import prisma from '@/lib/prisma';
//
// If you create a `lib/prisma.ts` file as suggested previously,
// you would replace `const prisma = new PrismaClient();` with `import prisma from '@/lib/prisma';`.
// For this example, we'll keep the direct instantiation.
const prisma = new PrismaClient();

// Import your actual UI components
import ImageBlock from '../components/ImageBlock';
import TextSection from '../components/TextSection';
import Card from '../components/Card';
import CTA from '../components/CTA';
import StatsBox from '../components/StatsBox';

// Map component names to their actual React components
const componentsMap = {
  ImageBlock,
  TextSection,
  Card,
  CTA,
  StatsBox,
};

// Define the expected structure of a component block from your database
interface DbComponentBlock {
  type: keyof typeof componentsMap; // Ensure type matches keys in componentsMap
  props: Record<string, any>; // Props can be any object
}

// Define the props for the Page component, using Next.js App Router's params
type PageProps = {
  params: {
    slug: string;
  };
};

// `export const dynamic = 'force-dynamic';` is often not strictly needed
// for async Server Components that fetch data, as they are dynamic by nature.
// However, keeping it ensures no static caching if that's your explicit intent.
export const dynamic = 'force-dynamic';

export default async function Page({ params }: PageProps) {
  const { slug } = await params; // params is already awaited by Next.js in Server Components

  let pageData;
  try {
    // *** MODIFIED: Fetch page data from the database using Prisma ***
    pageData = await prisma.page.findUnique({
      where: { slug: slug },
      // Select only the necessary fields to minimize data transfer
      select: { components: true, metadata: true },
    });

    // If no page data is found for the given slug, return a 404
    if (!pageData) {
      return notFound();
    }

  } catch (err) {
    console.error(`Error fetching page data for slug '${slug}':`, err);
    // In a production app, you might render a generic error page or log to an error monitoring service.
    // For now, we'll return a 404 for simplicity, or a custom error message.
    return notFound(); // Or render a custom error component
  } finally {
    // In Next.js Server Components, Prisma Client connections are managed efficiently
    // via connection pooling, so explicit disconnects are generally not needed
    // if you're using a singleton pattern for PrismaClient.
    // If not using a singleton, you might consider `await prisma.$disconnect();` here.
  }

  // Ensure components array is valid before mapping
  const componentsToRender: DbComponentBlock[] = (pageData.components || []) as DbComponentBlock[];

  return (
    <main className="flex flex-col gap-8 px-4 py-6 md:px-10 max-w-screen-xl mx-auto">
      {componentsToRender.map((block: any, i: number) => {
        // Ensure the component type exists in your map
        const Component = componentsMap[block.type];
        if (!Component) {
          console.warn(`Unknown component type: ${block.type} found for slug: ${slug}`);
          return null; // Don't render unknown components
        }
        return <Component key={i} {...block.props} />;
      })}
    </main>
  );
}