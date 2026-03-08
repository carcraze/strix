import posthog from 'posthog-js'

export function register() {
    if (typeof window !== 'undefined') {
        posthog.init(process.env.NEXT_PUBLIC_POSTHOG_TOKEN!, {
            api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
            person_profiles: 'always', // or 'identified_only'
            capture_pageview: true,
            persistence: 'localStorage',
        })
    }
}
