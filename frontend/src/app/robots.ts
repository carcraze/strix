import { MetadataRoute } from 'next'
import { headers } from 'next/headers'

export default async function robots(): Promise<MetadataRoute.Robots> {
  const headersList = await headers()
  const domain = headersList.get('host') || ''

  // Block indexing completely for the app and crm subdomains
  if (domain.includes('app.zentinel.dev') || domain.includes('crm.zentinel.dev')) {
    return {
      rules: {
        userAgent: '*',
        disallow: '/',
      },
    }
  }

  // Define aggressive AI scrapers to block (excluding those we explicitly welcome)
  const badBots = ['CCBot', 'Bytespider', 'Omgilibot', 'Omgili', 'FacebookBot', 'Diffbot', 'Amazonbot']
  
  const badBotRules = badBots.map(bot => ({
    userAgent: bot,
    disallow: '/',
  }))

  // AI crawlers — welcome (explicit allow including llms.txt)
  const goodAI = ['GPTBot', 'ClaudeBot', 'PerplexityBot', 'Googlebot', 'anthropic-ai', 'cohere-ai', 'ChatGPT-User']
  const goodAIRules = goodAI.map(bot => ({
    userAgent: bot,
    allow: ['/', '/llms.txt', '/faq', '/pricing'],
  }))

  // Default robots.txt for the main landing page
  return {
    rules: [
      ...goodAIRules,
      ...badBotRules,
      {
        userAgent: '*',
        allow: ['/llms.txt', '/faq', '/pricing', '/'],
        disallow: ['/dashboard/', '/crm/', '/api/', '/report/', '/auth/'],
      }
    ],
    sitemap: 'https://zentinel.dev/sitemap.xml',
  }
}
