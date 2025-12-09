import Link from "next/link"
import { Mail, Phone, MapPin } from "lucide-react"

export function Footer() {
  return (
    <footer className="bg-zinc-50 dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-zinc-900 dark:bg-zinc-100 rounded-xl" />
              <span className="font-bold text-zinc-900 dark:text-zinc-100">E-Commerce</span>
            </div>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Modern multi-vendor e-commerce platform for seamless shopping.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-4 text-sm">Shop</h4>
            <ul className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
              <li>
                <Link href="/shop" className="hover:text-zinc-900 dark:hover:text-zinc-100">
                  Products
                </Link>
              </li>
              <li>
                <Link href="/categories" className="hover:text-zinc-900 dark:hover:text-zinc-100">
                  Categories
                </Link>
              </li>
              <li>
                <Link href="/" className="hover:text-zinc-900 dark:hover:text-zinc-100">
                  Best Sellers
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-4 text-sm">Support</h4>
            <ul className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
              <li>
                <Link href="/" className="hover:text-zinc-900 dark:hover:text-zinc-100">
                  Help Center
                </Link>
              </li>
              <li>
                <Link href="/" className="hover:text-zinc-900 dark:hover:text-zinc-100">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/" className="hover:text-zinc-900 dark:hover:text-zinc-100">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-4 text-sm">Contact</h4>
            <ul className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
              <li className="flex items-center space-x-2">
                <Mail className="w-4 h-4" />
                <span>hello@ecommerce.local</span>
              </li>
              <li className="flex items-center space-x-2">
                <Phone className="w-4 h-4" />
                <span>+1 (555) 000-0000</span>
              </li>
              <li className="flex items-center space-x-2">
                <MapPin className="w-4 h-4" />
                <span>San Francisco, CA</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-zinc-200 dark:border-zinc-800 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">© 2026 E-Commerce. All rights reserved.</p>
            <div className="flex space-x-6 text-sm text-zinc-600 dark:text-zinc-400 mt-4 md:mt-0">
              <Link href="/" className="hover:text-zinc-900 dark:hover:text-zinc-100">
                Privacy
              </Link>
              <Link href="/" className="hover:text-zinc-900 dark:hover:text-zinc-100">
                Terms
              </Link>
              <Link href="/" className="hover:text-zinc-900 dark:hover:text-zinc-100">
                Cookies
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
