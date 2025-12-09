import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const hostname = request.headers.get("host") || ""

  const subdomain = extractSubdomain(hostname)

  // Skip middleware for static files, API routes, and Next.js internals
  if (
      pathname.startsWith("/_next") ||
      pathname.startsWith("/api") ||
      pathname.startsWith("/static") ||
      pathname.includes(".")
  ) {
    return NextResponse.next()
  }

  // Prevent direct access to tenant folders from wrong subdomain
  if (subdomain === null) {
    // Customer trying to access admin or vendor routes directly
    if (pathname.startsWith("/admin") || pathname.startsWith("/vendor")) {
      return NextResponse.redirect(new URL("/", request.url))
    }
  }

  if (subdomain === "admin") {
    if (pathname.startsWith("/vendor") || pathname.startsWith("/customer")) {
      return NextResponse.redirect(new URL("/dashboard", request.url))
    }
  }

  if (subdomain === "vendor") {
    if (pathname.startsWith("/admin") || pathname.startsWith("/customer")) {
      return NextResponse.redirect(new URL("/dashboard", request.url))
    }
  }

  // Route based on subdomain
  if (subdomain === "admin") {
    // admin.site.com
    if (pathname === "/") {
      return rewriteTo(request, "/admin/admin-dashboard")
    }
    if (!pathname.startsWith("/admin")) {
      const output = pathname.replace(/^\/(.*)$/, "/admin-$1");
      return rewriteTo(request, `/admin${output}`)
    }
  } else if (subdomain === "vendor") {
    // vendor.site.com
    if (pathname === "/") {
      return rewriteTo(request, "/vendor/dashboard")
    }
    if (!pathname.startsWith("/vendor")) {
      return rewriteTo(request, `/vendor${pathname}`)
    }
  } else {
    // site.com (customer)
    // Rewrite all customer requests to /customer/* paths
    if (!pathname.startsWith("/customer")) {
      return rewriteTo(request, `/customer${pathname}`)
    }
  }

  return NextResponse.next()
}

function rewriteTo(request: NextRequest, newPathname: string): NextResponse {
  const url = request.nextUrl.clone()
  url.pathname = newPathname
  console.log(`Rewriting: ${request.nextUrl.pathname} -> ${newPathname}`)
  return NextResponse.rewrite(url)
}

function extractSubdomain(hostname: string): string | null {
  const hostWithoutPort = hostname.split(":")[0]

  // === LOCAL DEVELOPMENT ===

  // Plain localhost - customer
  if (hostWithoutPort === "localhost" || hostWithoutPort === "127.0.0.1") {
    return null
  }

  // Subdomain on localhost (e.g., admin.localhost)
  // Note: You need to add "admin.localhost" to /etc/hosts or use a tool like nip.io
  if (hostWithoutPort.endsWith(".localhost") || hostWithoutPort.endsWith("127.0.0.1")) {
    const parts = hostWithoutPort.split(".")
    return parts[0] // admin.localhost → admin
  }

  // Local development with custom domain (e.g., admin.site.local)
  if (hostWithoutPort.endsWith(".local")) {
    const parts = hostWithoutPort.split(".")
    if (parts.length >= 3) {
      return parts[0] // admin.site.local → admin
    }
    return null // site.local → customer
  }

  // Using nip.io for local testing (e.g., admin.127.0.0.1.nip.io)
  if (hostWithoutPort.endsWith(".nip.io")) {
    const parts = hostWithoutPort.split(".")
    // admin.127.0.0.1.nip.io → ["admin", "127", "0", "0", "1", "nip", "io"]
    if (parts.length > 5) {
      return parts[0]
    }
    return null
  }

  // === PRODUCTION ===

  const parts = hostWithoutPort.split(".")

  // Handle common TLDs
  // site.com → 2 parts → no subdomain
  // admin.site.com → 3 parts → subdomain is "admin"
  // site.co.uk → 3 parts → no subdomain (tricky!)
  // admin.site.co.uk → 4 parts → subdomain is "admin"

  // List of known multi-part TLDs
  const multiPartTLDs = [
    "co.uk", "co.jp", "co.kr", "co.nz", "co.za", "co.in",
    "com.au", "com.br", "com.mx", "com.sg", "com.hk",
    "org.uk", "net.uk", "gov.uk", "ac.uk",
    "ne.jp", "or.jp"
  ]

  const hostLower = hostWithoutPort.toLowerCase()
  const isMultiPartTLD = multiPartTLDs.some(tld => hostLower.endsWith(`.${tld}`))

  if (isMultiPartTLD) {
    // admin.site.co.uk → 4 parts needed for subdomain
    if (parts.length >= 4) {
      const subdomain = parts[0]
      return subdomain === "www" ? null : subdomain
    }
  } else {
    // admin.site.com → 3 parts needed for subdomain
    if (parts.length >= 3) {
      const subdomain = parts[0]
      return subdomain === "www" ? null : subdomain
    }
  }

  return null
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*|public).*)",
  ],
}