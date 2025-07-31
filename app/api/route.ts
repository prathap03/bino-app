import { writeFile, mkdir, access } from 'fs/promises';
import path from 'path';
import { NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client'; // Import PrismaClient

// Instantiate PrismaClient.
// It's generally recommended to create a singleton instance for PrismaClient
// across your Next.js application to avoid exhausting database connections
// in serverless environments.
// For example, you might create a `lib/prisma.ts` file:
//
// // lib/prisma.ts
// import { PrismaClient } from '@prisma/client'
//
// const prismaClientSingleton = () => {
//   return new PrismaClient()
// }
//
// declare global {
//   var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>
// }
//
// const prisma = globalThis.prismaGlobal ?? prismaClientSingleton()
//
// export default prisma
//
// if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma
//
// If you use the singleton pattern, you would then `import prisma from '@/lib/prisma';`
// and remove `const prisma = new PrismaClient();` from this file.
// For this example, we'll keep the direct instantiation.
const prisma = new PrismaClient();

// Types for better type safety
interface ComponentBlock {
  type: 'ImageBlock' | 'TextSection' | 'Card' | 'CTA' | 'StatsBox';
  props: Record<string, any>;
}

interface CreatePageRequest {
  slug: string;
  components: ComponentBlock[];
  metadata?: {
    title?: string;
    description?: string;
    tags?: string[];
  };
}

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: string;
}

// Validation schemas
const VALID_COMPONENT_TYPES = ['ImageBlock', 'TextSection', 'Card', 'CTA', 'StatsBox'] as const;

const validateSlug = (slug: string): boolean => {
  return /^[a-zA-Z0-9-_]+$/.test(slug) && slug.length >= 1 && slug.length <= 100;
};

const validateComponent = (component: any): component is ComponentBlock => {
  return (
    component &&
    typeof component === 'object' &&
    typeof component.type === 'string' &&
    VALID_COMPONENT_TYPES.includes(component.type) &&
    component.props &&
    typeof component.props === 'object'
  );
};

const createResponse = <T>(
  success: boolean,
  data?: T,
  error?: { code: string; message: string; details?: any },
  status: number = 200
): Response => {
  const response: ApiResponse<T> = {
    success,
    timestamp: new Date().toISOString(),
    ...(data && { data }),
    ...(error && { error })
  };

  return new Response(JSON.stringify(response, null, 2), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'X-API-Version': '1.0.0'
    }
  });
};

// Ensure directory exists
const ensureDirectoryExists = async (dirPath: string): Promise<void> => {
  try {
    await access(dirPath);
  } catch {
    await mkdir(dirPath, { recursive: true });
  }
};

/**
 * @openapi
 * /api/pages:
 *   post:
 *     summary: Create a new dynamic page
 *     description: Creates a new page with specified components and saves it as a JSON file
 *     tags:
 *       - Pages
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - slug
 *               - components
 *             properties:
 *               slug:
 *                 type: string
 *                 pattern: '^[a-zA-Z0-9-_]+$'
 *                 minLength: 1
 *                 maxLength: 100
 *                 description: URL-friendly identifier for the page
 *                 example: "about-us"
 *               components:
 *                 type: array
 *                 minItems: 1
 *                 items:
 *                   type: object
 *                   required:
 *                     - type
 *                     - props
 *                   properties:
 *                     type:
 *                       type: string
 *                       enum: [ImageBlock, TextSection, Card, CTA, StatsBox]
 *                       description: Type of component to render
 *                     props:
 *                       type: object
 *                       description: Component-specific properties
 *                       additionalProperties: true
 *               metadata:
 *                 type: object
 *                 properties:
 *                   title:
 *                     type: string
 *                     description: Page title for SEO
 *                     example: "About Us - Company Name"
 *                   description:
 *                     type: string
 *                     description: Page description for SEO
 *                     example: "Learn more about our company and values"
 *                   tags:
 *                     type: array
 *                     items:
 *                       type: string
 *                     description: Tags for categorization
 *           examples:
 *             simple-page:
 *               summary: Simple text page
 *               value:
 *                 slug: "simple-page"
 *                 components:
 *                   - type: "TextSection"
 *                     props:
 *                       title: "Welcome"
 *                       content: "This is a simple page"
 *             complex-page:
 *               summary: Complex page with multiple components
 *               value:
 *                 slug: "landing-page"
 *                 components:
 *                   - type: "ImageBlock"
 *                     props:
 *                       src: "/hero.jpg"
 *                       alt: "Hero image"
 *                   - type: "TextSection"
 *                     props:
 *                       title: "About Us"
 *                       content: "We are a leading company..."
 *                   - type: "CTA"
 *                     props:
 *                       text: "Get Started"
 *                       href: "/signup"
 *                 metadata:
 *                   title: "Landing Page - Our Company"
 *                   description: "Welcome to our amazing platform"
 *                   tags: ["landing", "marketing"]
 *     responses:
 *       201:
 *         description: Page created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     slug:
 *                       type: string
 *                       example: "about-us"
 *                     url:
 *                       type: string
 *                       example: "/about-us"
 *                     filePath:
 *                       type: string
 *                       example: "app/generated/about-us.json"
 *                     componentCount:
 *                       type: integer
 *                       example: 3
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Invalid request data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: object
 *                   properties:
 *                     code:
 *                       type: string
 *                       example: "VALIDATION_ERROR"
 *                     message:
 *                       type: string
 *                       example: "Invalid slug format"
 *                     details:
 *                       type: object
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       409:
 *         description: Page already exists
 *       500:
 *         description: Internal server error
 */
export async function POST(req: NextRequest) {
  try {
    let body: CreatePageRequest;
    try {
      body = await req.json();
    } catch (error) {
      return createResponse(
        false,
        undefined,
        {
          code: 'INVALID_JSON',
          message: 'Request body must be valid JSON',
          details: { error: error instanceof Error ? error.message : 'Unknown parsing error' },
        },
        400
      );
    }

    const { slug, components, metadata } = body;

    // --- Start Validation Logic (keep as is) ---
    // List of slugs that are reserved by Next.js or your app structure
    const RESERVED_SLUGS = ['api', 'documentation', '_next', 'static', 'public', 'favicon.ico'];
    if (RESERVED_SLUGS.includes(slug.toLowerCase())) {
      return createResponse(
        false,
        undefined,
        {
          code: 'RESERVED_SLUG',
          message: `Slug '${slug}' is a reserved system path and cannot be used for a page.`,
          details: { slug, reserved: RESERVED_SLUGS }
        },
        400
      );
    }

    if (!slug || !validateSlug(slug)) {
        return createResponse(false, undefined, { code: 'INVALID_SLUG', message: 'Invalid or missing slug' }, 400);
    }
    if (!Array.isArray(components) || components.length === 0) {
        return createResponse(false, undefined, { code: 'INVALID_COMPONENTS', message: 'Components array is required and cannot be empty' }, 400);
    }
    const invalidComponents: Array<{ index: number; error: string }> = [];
    components.forEach((component, index) => {
        if (!validateComponent(component)) {
            invalidComponents.push({
                index,
                error: `Invalid component at index ${index}. Must have 'type' (one of: ${VALID_COMPONENT_TYPES.join(', ')}) and 'props' object`
            });
        }
    });
    if (invalidComponents.length > 0) {
        return createResponse(false, undefined, { code: 'INVALID_COMPONENT_STRUCTURE', message: 'One or more components have invalid structure', details: { invalidComponents, validTypes: VALID_COMPONENT_TYPES } }, 400);
    }
    // --- End Validation Logic ---


    try {
      // *** MODIFIED: Use Prisma to create a new record in the Supabase database ***
      const newPage = await prisma.page.create({
        data: {
          slug: slug,
          components: components as any, // Cast to any for Json type handling
          metadata: metadata as any,    // Cast to any for Json? type handling
        },
      });

      // If you are using revalidation for SSG/ISR, you could trigger it here:
      // import { revalidatePath } from 'next/cache'; // Add this import at the top
      // revalidatePath(`/${slug}`); // Example if you want to revalidate the page immediately

      return createResponse(
        true,
        {
          id: newPage.id, // Return the database ID
          slug: newPage.slug,
          url: `/${newPage.slug}`, // The public URL for the dynamically created page
          componentCount: components.length,
          metadata: newPage.metadata,
        },
        undefined,
        201
      );
    } catch (dbError: any) {
      // Handle unique constraint violation (Prisma error code P2002)
      if (dbError.code === 'P2002') {
        return createResponse(
          false,
          undefined,
          {
            code: 'PAGE_EXISTS',
            message: `Page with slug '${slug}' already exists in the database.`,
            details: { slug },
          },
          409
        );
      }
      console.error('Database error creating page:', dbError);
      return createResponse(
        false,
        undefined,
        {
          code: 'DATABASE_ERROR',
          message: 'Failed to save page to database.',
          details: process.env.NODE_ENV === 'development' ? dbError.message : undefined,
        },
        500
      );
    }
  } catch (error) {
    console.error('Error in POST handler (outer catch):', error);
    return createResponse(
      false,
      undefined,
      {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred while processing the request.',
        details:
          process.env.NODE_ENV === 'development'
            ? {
                error: error instanceof Error ? error.message : 'Unknown error',
                stack: error instanceof Error ? error.stack : undefined,
              }
            : undefined,
      },
      500
    );
  } finally {
    // Disconnect Prisma client if not using a singleton pattern.
    // With a singleton (recommended for Vercel/serverless), you often don't explicitly disconnect here.
    // await prisma.$disconnect();
  }
}


/**
 * @openapi
 * /api/pages:
 *   get:
 *     summary: Interactive API Documentation
 *     description: Returns a beautiful, interactive documentation page for the Dynamic Page Creation API
 *     tags:
 *       - Pages
 *     responses:
 *       200:
 *         description: Interactive documentation page
 *         content:
 *           text/html:
 *             schema:
 *               type: string
 */
export async function GET() {
  const documentationHTML = `
<!DOCTYPE html>
<html lang="en" class="scroll-smooth">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dynamic Page Creation API - Documentation</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://unpkg.com/alpinejs@3.x.x/dist/cdn.min.js" defer></script>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism-tomorrow.min.css" rel="stylesheet">
    <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-core.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/plugins/autoloader/prism-autoloader.min.js"></script>
    <style>
        .gradient-bg { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
        .glass { backdrop-filter: blur(10px); background: rgba(255, 255, 255, 0.1); }
        .dark .glass { background: rgba(0, 0, 0, 0.2); }
        .animate-float { animation: float 6s ease-in-out infinite; }
        @keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-20px); } }
        .animate-pulse-slow { animation: pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
        pre[class*="language-"] { border-radius: 12px; }
        .component-card { transition: all 0.3s ease; }
        .component-card:hover { transform: translateY(-8px); box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); }
    </style>
    <script>
        tailwind.config = {
            darkMode: 'class',
            theme: {
                extend: {
                    animation: {
                        'float': 'float 6s ease-in-out infinite',
                        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                    }
                }
            }
        }
    </script>
</head>
<body class="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300" x-data="{ darkMode: false, activeTab: 'overview', copySuccess: false }" x-init="darkMode = localStorage.getItem('darkMode') === 'true' || (!localStorage.getItem('darkMode') && window.matchMedia('(prefers-color-scheme: dark)').matches)" :class="{ 'dark': darkMode }">
    
    <!-- Navigation -->
    <nav class="sticky top-0 z-50 glass border-b border-white/20 dark:border-gray-700/50">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between items-center h-16">
                <div class="flex items-center space-x-3">
                    <div class="w-10 h-10 gradient-bg rounded-lg flex items-center justify-center animate-pulse-slow">
                        <span class="text-white text-xl font-bold">🚀</span>
                    </div>
                    <div>
                        <h1 class="text-xl font-bold text-gray-900 dark:text-white">Dynamic Pages API</h1>
                        <p class="text-sm text-gray-600 dark:text-gray-400">v2.0.0</p>
                    </div>
                </div>
                <div class="flex items-center space-x-4">
                    <button @click="darkMode = !darkMode; localStorage.setItem('darkMode', darkMode)" class="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
                        <span x-show="!darkMode" class="text-xl">🌙</span>
                        <span x-show="darkMode" class="text-xl">☀️</span>
                    </button>
                    <a href="https://github.com" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">GitHub</a>
                </div>
            </div>
        </div>
    </nav>

    <!-- Hero Section -->
    <section class="relative overflow-hidden">
        <div class="gradient-bg relative">
            <div class="absolute inset-0 bg-black/20"></div>
            <div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
                <div class="text-center">
                    <div class="animate-float mb-8">
                        <span class="text-8xl">✨</span>
                    </div>
                    <h1 class="text-5xl md:text-7xl font-bold text-white mb-6">
                        Build <span class="bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">Dynamic</span> Pages
                    </h1>
                    <p class="text-xl md:text-2xl text-white/90 mb-8 max-w-3xl mx-auto">
                        Create stunning, responsive pages with animated components, dark mode support, and incredible customization options.
                    </p>
                    <div class="flex flex-col sm:flex-row gap-4 justify-center">
                        <button @click="activeTab = 'quickstart'" class="px-8 py-4 bg-white text-gray-900 rounded-xl font-semibold hover:bg-gray-100 transition-all transform hover:scale-105">
                            🚀 Quick Start
                        </button>
                        <button @click="activeTab = 'components'" class="px-8 py-4 bg-white/10 backdrop-blur text-white border border-white/30 rounded-xl font-semibold hover:bg-white/20 transition-all">
                            📚 View Components
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Main Content -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <!-- Tab Navigation -->
        <div class="flex flex-wrap gap-2 mb-12 p-1 bg-gray-200 dark:bg-gray-800 rounded-xl">
            <button @click="activeTab = 'overview'" :class="{ 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400': activeTab === 'overview' }" class="px-6 py-3 rounded-lg font-medium transition-all hover:bg-white/50 dark:hover:bg-gray-700/50">
                📋 Overview
            </button>
            <button @click="activeTab = 'quickstart'" :class="{ 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400': activeTab === 'quickstart' }" class="px-6 py-3 rounded-lg font-medium transition-all hover:bg-white/50 dark:hover:bg-gray-700/50">
                🚀 Quick Start
            </button>
            <button @click="activeTab = 'components'" :class="{ 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400': activeTab === 'components' }" class="px-6 py-3 rounded-lg font-medium transition-all hover:bg-white/50 dark:hover:bg-gray-700/50">
                🧩 Components
            </button>
            <button @click="activeTab = 'examples'" :class="{ 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400': activeTab === 'examples' }" class="px-6 py-3 rounded-lg font-medium transition-all hover:bg-white/50 dark:hover:bg-gray-700/50">
                💡 Examples
            </button>
            <button @click="activeTab = 'playground'" :class="{ 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400': activeTab === 'playground' }" class="px-6 py-3 rounded-lg font-medium transition-all hover:bg-white/50 dark:hover:bg-gray-700/50">
                🎮 Playground
            </button>
        </div>

        <!-- Overview Tab -->
        <div x-show="activeTab === 'overview'" x-transition class="space-y-12">
            <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div class="component-card bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
                    <div class="text-4xl mb-4">🎨</div>
                    <h3 class="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Dark/Light Mode</h3>
                    <p class="text-gray-600 dark:text-gray-400">Automatic theme switching with beautiful transitions</p>
                </div>
                <div class="component-card bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
                    <div class="text-4xl mb-4">📱</div>
                    <h3 class="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Fully Responsive</h3>
                    <p class="text-gray-600 dark:text-gray-400">Mobile-first design that works everywhere</p>
                </div>
                <div class="component-card bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
                    <div class="text-4xl mb-4">✨</div>
                    <h3 class="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Smooth Animations</h3>
                    <p class="text-gray-600 dark:text-gray-400">Framer Motion powered smooth transitions</p>
                </div>
                <div class="component-card bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
                    <div class="text-4xl mb-4">🎛️</div>
                    <h3 class="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Highly Customizable</h3>
                    <p class="text-gray-600 dark:text-gray-400">Endless styling and animation options</p>
                </div>
            </div>

            <div class="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 p-8 rounded-2xl border border-blue-200 dark:border-blue-800">
                <h2 class="text-3xl font-bold mb-6 text-gray-900 dark:text-white">🚀 Features</h2>
                <div class="grid md:grid-cols-2 gap-6">
                    <ul class="space-y-3">
                        <li class="flex items-center space-x-3">
                            <span class="text-green-500">✅</span>
                            <span class="text-gray-700 dark:text-gray-300">TypeScript support</span>
                        </li>
                        <li class="flex items-center space-x-3">
                            <span class="text-green-500">✅</span>
                            <span class="text-gray-700 dark:text-gray-300">Production-ready performance</span>
                        </li>
                        <li class="flex items-center space-x-3">
                            <span class="text-green-500">✅</span>
                            <span class="text-gray-700 dark:text-gray-300">Accessibility compliant</span>
                        </li>
                        <li class="flex items-center space-x-3">
                            <span class="text-green-500">✅</span>
                            <span class="text-gray-700 dark:text-gray-300">Multiple style variants</span>
                        </li>
                    </ul>
                    <ul class="space-y-3">
                        <li class="flex items-center space-x-3">
                            <span class="text-green-500">✅</span>
                            <span class="text-gray-700 dark:text-gray-300">Glass morphism effects</span>
                        </li>
                        <li class="flex items-center space-x-3">
                            <span class="text-green-500">✅</span>
                            <span class="text-gray-700 dark:text-gray-300">Gradient customization</span>
                        </li>
                        <li class="flex items-center space-x-3">
                            <span class="text-green-500">✅</span>
                            <span class="text-gray-700 dark:text-gray-300">Interactive animations</span>
                        </li>
                        <li class="flex items-center space-x-3">
                            <span class="text-green-500">✅</span>
                            <span class="text-gray-700 dark:text-gray-300">SEO optimized</span>
                        </li>
                    </ul>
                </div>
            </div>
        </div>

        <!-- Quick Start Tab -->
        <div x-show="activeTab === 'quickstart'" x-transition class="space-y-8">
            <div class="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
                <h2 class="text-3xl font-bold mb-6 text-gray-900 dark:text-white">🚀 Quick Start</h2>
                <div class="space-y-6">
                    <div>
                        <h3 class="text-xl font-semibold mb-3 text-gray-900 dark:text-white">1. Create Your First Page</h3>
                        <div class="relative">
                            <pre class="language-bash"><code>curl -X POST ${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}/api \\
  -H "Content-Type: application/json" \\
  -d '{
    "slug": "my-first-page",
    "components": [
      {
        "type": "TextSection",
        "props": {
          "title": "Hello World!",
          "subtitle": "My first dynamic page",
          "text": "This is amazing!"
        }
      }
    ]
  }'</code></pre>
                            <button @click="navigator.clipboard.writeText(\`curl -X POST \${window.location.origin}/api -H 'Content-Type: application/json' -d '{\\"slug\\": \\"my-first-page\\", \\"components\\": [{\\"type\\": \\"TextSection\\", \\"props\\": {\\"title\\": \\"Hello World!\\", \\"subtitle\\": \\"My first dynamic page\\", \\"text\\": \\"This is amazing!\\"}}]}'\`); copySuccess = true; setTimeout(() => copySuccess = false, 2000)" class="absolute top-4 right-4 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors">
                                <span x-show="!copySuccess">Copy</span>
                                <span x-show="copySuccess" class="text-green-200">✅ Copied!</span>
                            </button>
                        </div>
                    </div>
                    
                    <div>
                        <h3 class="text-xl font-semibold mb-3 text-gray-900 dark:text-white">2. View Your Page</h3>
                        <p class="text-gray-600 dark:text-gray-400 mb-3">Visit your newly created page:</p>
                        <div class="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
                            <code class="text-blue-600 dark:text-blue-400">${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}/my-first-page</code>
                        </div>
                    </div>

                    <div class="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-4 rounded-lg">
                        <div class="flex items-start space-x-3">
                            <span class="text-yellow-500 text-xl">💡</span>
                            <div>
                                <h4 class="font-semibold text-yellow-800 dark:text-yellow-200">Pro Tip</h4>
                                <p class="text-yellow-700 dark:text-yellow-300">Add animation delays to create staggered entrance effects for multiple components!</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Components Tab -->
        <div x-show="activeTab === 'components'" x-transition class="space-y-8">
            <div class="grid gap-8">
                <!-- StatsBox Component -->
                <div class="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
                    <div class="flex items-center space-x-3 mb-6">
                        <span class="text-3xl">📊</span>
                        <div>
                            <h3 class="text-2xl font-bold text-gray-900 dark:text-white">StatsBox</h3>
                            <p class="text-gray-600 dark:text-gray-400">Display statistics with icons and animations</p>
                        </div>
                    </div>
                    <div class="grid md:grid-cols-2 gap-6">
                        <div>
                            <h4 class="font-semibold mb-3 text-gray-900 dark:text-white">Props</h4>
                            <ul class="space-y-2 text-sm">
                                <li><code class="text-red-600 dark:text-red-400">label*</code> - Statistics label</li>
                                <li><code class="text-red-600 dark:text-red-400">value*</code> - Display value</li>
                                <li><code class="text-blue-600 dark:text-blue-400">icon</code> - Emoji or icon</li>
                                <li><code class="text-blue-600 dark:text-blue-400">size</code> - sm, md, lg, xl</li>
                                <li><code class="text-blue-600 dark:text-blue-400">animation</code> - fadeInUp, bounce, scale</li>
                            </ul>
                        </div>
                        <div>
                            <h4 class="font-semibold mb-3 text-gray-900 dark:text-white">Example</h4>
                            <pre class="language-json text-xs"><code>{
  "type": "StatsBox",
  "props": {
    "label": "Total Users",
    "value": "10,000+",
    "icon": "👥",
    "size": "lg",
    "animation": "bounce"
  }
}</code></pre>
                        </div>
                    </div>
                </div>

                <!-- Card Component -->
                <div class="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
                    <div class="flex items-center space-x-3 mb-6">
                        <span class="text-3xl">🃏</span>
                        <div>
                            <h3 class="text-2xl font-bold text-gray-900 dark:text-white">Card</h3>
                            <p class="text-gray-600 dark:text-gray-400">Versatile cards with images and actions</p>
                        </div>
                    </div>
                    <div class="grid md:grid-cols-2 gap-6">
                        <div>
                            <h4 class="font-semibold mb-3 text-gray-900 dark:text-white">Variants</h4>
                            <ul class="space-y-2 text-sm">
                                <li><span class="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">default</span> - Standard card</li>
                                <li><span class="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-xs">glass</span> - Glass morphism</li>
                                <li><span class="px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded text-xs">gradient</span> - Gradient background</li>
                                <li><span class="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded text-xs">minimal</span> - Minimal design</li>
                            </ul>
                        </div>
                        <div>
                            <h4 class="font-semibold mb-3 text-gray-900 dark:text-white">Animations</h4>
                            <ul class="space-y-2 text-sm">
                                <li><code class="text-blue-600 dark:text-blue-400">hover</code> - Scale on hover</li>
                                <li><code class="text-blue-600 dark:text-blue-400">float</code> - Floating animation</li>
                                <li><code class="text-blue-600 dark:text-blue-400">tilt</code> - 3D tilt effect</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Examples Tab -->
        <div x-show="activeTab === 'examples'" x-transition class="space-y-8">
            <div class="grid lg:grid-cols-2 gap-8">
                <div class="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
                    <h3 class="text-xl font-bold mb-4 text-gray-900 dark:text-white">🌟 Landing Page</h3>
                    <pre class="language-json text-xs"><code>{
  "slug": "awesome-landing",
  "components": [
    {
      "type": "TextSection",
      "props": {
        "title": "Welcome to the Future",
        "subtitle": "Revolutionary Platform",
        "size": "xl",
        "gradient": "from-blue-600 to-purple-600"
      }
    },
    {
      "type": "CTA",
      "props": {
        "heading": "Ready to Start?",
        "ctaText": "Get Started",
        "href": "/signup",
        "pattern": true
      }
    }
  ]
}</code></pre>
                </div>
                
                <div class="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
                    <h3 class="text-xl font-bold mb-4 text-gray-900 dark:text-white">🎨 Portfolio Page</h3>
                    <pre class="language-json text-xs"><code>{
  "slug": "my-portfolio",
  "components": [
    {
      "type": "ImageBlock",
      "props": {
        "src": "/hero.jpg",
        "alt": "Portfolio hero",
        "aspect": "wide",
        "animation": "zoom"
      }
    },
    {
      "type": "Card",
      "props": {
        "title": "My Work",
        "variant": "glass",
        "animation": "float"
      }
    }
  ]
}</code></pre>
                </div>
            </div>
        </div>

        <!-- Playground Tab -->
        <div x-show="activeTab === 'playground'" x-transition>
            <div class="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
                <h2 class="text-3xl font-bold mb-6 text-gray-900 dark:text-white">🎮 API Playground</h2>
                <div class="grid lg:grid-cols-2 gap-8">
                    <div>
                        <h3 class="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Try it out:</h3>
                        <textarea class="w-full h-64 p-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm" placeholder='Enter your JSON payload here...' x-model="playgroundJson">{
  "slug": "test-page",
  "components": [
    {
      "type": "TextSection",
      "props": {
        "title": "Test Page",
        "subtitle": "Created from playground",
        "animation": "fadeInUp"
      }
    }
  ]
}</textarea>
                        <button @click="fetch('/api', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: playgroundJson }).then(r => r.json()).then(d => playgroundResult = JSON.stringify(d, null, 2))" class="mt-4 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                            🚀 Send Request
                        </button>
                    </div>
                    <div>
                        <h3 class="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Response:</h3>
                        <pre class="w-full h-64 p-4 bg-gray-900 text-green-400 rounded-lg overflow-auto text-xs" x-text="playgroundResult || 'Response will appear here...'"></pre>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Footer -->
    <footer class="bg-gray-900 text-white py-12">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="text-center">
                <div class="text-4xl mb-4">🚀</div>
                <h3 class="text-2xl font-bold mb-2">Ready to build something amazing?</h3>
                <p class="text-gray-400 mb-6">Start creating dynamic pages with our powerful API</p>
                <button @click="activeTab = 'quickstart'" class="px-8 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-colors">
                    Get Started Now
                </button>
            </div>
        </div>
    </footer>

    <script>
        // Initialize playground data
        document.addEventListener('alpine:init', () => {
            Alpine.data('playground', () => ({
                playgroundJson: JSON.stringify({
                    slug: "test-page",
                    components: [{
                        type: "TextSection",
                        props: {
                            title: "Test Page",
                            subtitle: "Created from playground",
                            animation: "fadeInUp"
                        }
                    }]
                }, null, 2),
                playgroundResult: ''
            }))
        })
    </script>
</body>
</html>
  `;

  return new Response(documentationHTML, {
    status: 200,
    headers: {
      'Content-Type': 'text/html',
      'Cache-Control': 'public, max-age=3600'
    }
  });
}  