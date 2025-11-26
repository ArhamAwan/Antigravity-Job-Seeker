import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  name?: string;
  type?: string;
  image?: string;
  url?: string;
}

const SEO: React.FC<SEOProps> = ({ 
  title, 
  description, 
  name = 'JobNado AI', 
  type = 'website',
  image = 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop',
  url = 'https://jobnado.ai'
}) => {
  const siteTitle = title ? `${title} | ${name}` : name;
  const metaDescription = description || "JobNado AI: The antigravity career engine. Decode your CV, find hidden opportunities, and launch your career into orbit.";

  return (
    <Helmet>
      {/* Standard metadata tags */}
      <title>{siteTitle}</title>
      <meta name='description' content={metaDescription} />
      <link rel="canonical" href={url} />

      {/* Open Graph tags (Facebook, LinkedIn) */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={siteTitle} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:image" content={image} />
      <meta property="og:url" content={url} />
      <meta property="og:site_name" content={name} />

      {/* Twitter Card tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={siteTitle} />
      <meta name="twitter:description" content={metaDescription} />
      <meta name="twitter:image" content={image} />
    </Helmet>
  );
};

export default SEO;
