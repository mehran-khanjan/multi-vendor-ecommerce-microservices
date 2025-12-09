// src/config/auth.config.ts
export default () => ({
  jwt: {
    secret: process.env.JWT_SECRET,
    issuer: process.env.JWT_ISSUER || 'https://auth.site.com',
    audience: process.env.JWT_AUDIENCE || 'https://api.site.com',
    expiration: process.env.JWT_EXPIRATION || '15m',
    refreshExpiration: process.env.JWT_REFRESH_EXPIRATION || '7d',
  },

  jwks: {
    uri: process.env.JWKS_URI || null,
    cache: true,
    rateLimit: true,
    requestsPerMinute: 10,
  },

  // Public operations that don't require authentication
  publicOperations: [
    // Auth operations
    'Login',
    'Register',
    'RefreshToken',
    'ForgotPassword',
    'ResetPassword',
    'VerifyEmail',
    'ResendVerificationEmail',
    'OAuthRedirect',
    'OAuthCallback',

    // Public queries
    'GetProducts',
    'GetProduct',
    'GetProductBySlug',
    'GetCategories',
    'GetCategory',
    'GetCategoryBySlug',
    'SearchProducts',
    'GetFeaturedProducts',
    'GetVendorStore',
    'GetVendorStoreBySlug',
    'GetBlogPosts',
    'GetBlogPost',
    'GetBlogPostBySlug',
    'GetPages',
    'GetPage',
    'GetHomePage',
    'GetFAQs',
    'GetReviews',

    // Introspection
    '__schema',
    '__type',
  ],
});
