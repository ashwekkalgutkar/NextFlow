import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding demo database...')

  // Create a demo user if doesn't exist
  const user = await prisma.user.upsert({
    where: { clerkId: 'demo_clerk_id' },
    update: {},
    create: {
      clerkId: 'demo_clerk_id',
    },
  })

  // Sample workflow JSON 
  const sampleNodes = [
    { id: 'upload-image-1', type: 'imageUploadNode', position: { x: 50, y: 50 }, data: { label: 'Upload Image' } },
    { id: 'crop-1', type: 'cropImageNode', position: { x: 350, y: 50 }, data: { xPercent: 10, yPercent: 10, widthPercent: 80, heightPercent: 80 } },
    { id: 'text-system-1', type: 'textNode', position: { x: 350, y: 250 }, data: { text: "You are a professional marketing copywriter. Generate a compelling one-paragraph product description." } },
    { id: 'text-user-1', type: 'textNode', position: { x: 350, y: 380 }, data: { text: "Product: Wireless Bluetooth Headphones. Features: Noise cancellation, 30-hour battery, foldable design." } },
    { id: 'llm-1', type: 'llmNode', position: { x: 650, y: 150 }, data: { model: 'gemini-2.0-flash-exp' } },
    { id: 'upload-video-1', type: 'videoUploadNode', position: { x: 50, y: 500 }, data: { label: 'Upload Video' } },
    { id: 'extract-1', type: 'extractFrameNode', position: { x: 350, y: 500 }, data: { timestamp: '50%' } },
    { id: 'text-system-2', type: 'textNode', position: { x: 650, y: 450 }, data: { text: "You are a social media manager. Create a tweet-length marketing post based on the product image and video frame." } },
    { id: 'llm-2', type: 'llmNode', position: { x: 950, y: 300 }, data: { model: 'gemini-2.0-flash-exp', label: 'Final Marketing Summary' } }
  ]

  const sampleEdges = [
    { id: 'e1', source: 'upload-image-1', target: 'crop-1', targetHandle: 'image_url', sourceHandle: 'image_url' },
    { id: 'e2', source: 'crop-1', target: 'llm-1', targetHandle: 'images', sourceHandle: 'image_url' },
    { id: 'e3', source: 'text-system-1', target: 'llm-1', targetHandle: 'system_prompt', sourceHandle: 'text' },
    { id: 'e4', source: 'text-user-1', target: 'llm-1', targetHandle: 'user_message', sourceHandle: 'text' },
    { id: 'e5', source: 'upload-video-1', target: 'extract-1', targetHandle: 'video_url', sourceHandle: 'video_url' },
    { id: 'e6', source: 'llm-1', target: 'llm-2', targetHandle: 'user_message', sourceHandle: 'text' },
    { id: 'e7', source: 'crop-1', target: 'llm-2', targetHandle: 'images', sourceHandle: 'image_url' },
    { id: 'e8', source: 'extract-1', target: 'llm-2', targetHandle: 'images', sourceHandle: 'image_url' },
    { id: 'e9', source: 'text-system-2', target: 'llm-2', targetHandle: 'system_prompt', sourceHandle: 'text' }
  ]

  await prisma.workflow.create({
    data: {
      name: "Product Marketing Kit Generator",
      userId: user.id,
      nodes: sampleNodes,
      edges: sampleEdges,
    }
  })

  console.log('Seed completed.')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
