import { Helmet } from 'react-helmet-async'

interface SEOProps {
    title: string
    description?: string
    image?: string
    url?: string
    type?: 'website' | 'article' | 'video.movie' | 'music.song'
}

export default function SEO({
    title,
    description = 'منصة التراث - اكتشف روائع التراث اليمني من أناشيد وزوامل ومقاطع مرئية نادرة.',
    image = '/og-image.jpg',
    url = window.location.href,
    type = 'website'
}: SEOProps) {
    const siteTitle = 'منصة التراث'
    const fullTitle = `${title} | ${siteTitle}`

    return (
        <Helmet>
            {/* Basic Meta Tags */}
            <title>{fullTitle}</title>
            <meta name="description" content={description} />
            <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />

            {/* Open Graph / Facebook */}
            <meta property="og:type" content={type} />
            <meta property="og:url" content={url} />
            <meta property="og:title" content={fullTitle} />
            <meta property="og:description" content={description} />
            <meta property="og:image" content={image} />

            {/* Twitter */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:url" content={url} />
            <meta name="twitter:title" content={fullTitle} />
            <meta name="twitter:description" content={description} />
            <meta name="twitter:image" content={image} />

            {/* Theme Color */}
            <meta name="theme-color" content="#1a1a1a" />
        </Helmet>
    )
}
