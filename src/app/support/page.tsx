import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Support | The Giddy List",
  description:
    "Get help with The Giddy List Chrome extension. FAQs, troubleshooting, and contact information.",
};

const FAQ_ITEMS = [
  {
    q: "How do I save a product?",
    a: 'Navigate to any product page on a supported retailer (Amazon, Target, Walmart, and thousands more). Click the Giddy List extension icon in your toolbar, select a kid or registry, and hit "Add."',
  },
  {
    q: "Which stores are supported?",
    a: "The extension works on virtually any online store. It automatically pulls the product title, image, and price from the page. Major retailers like Amazon, Target, and Walmart have enhanced scraping for the best results.",
  },
  {
    q: "Do I need an account?",
    a: "Yes. You need a free account on thegiddylist.com with at least one kid profile added. The extension uses your logged-in session to save items to your wishlists.",
  },
  {
    q: 'Why does it say "Not logged in"?',
    a: "Make sure you are signed in at thegiddylist.com in the same browser. The extension reads your login session from thegiddylist.com cookies. Try logging in again, then reopen the extension.",
  },
  {
    q: "Can I add items to a registry?",
    a: 'Yes. After clicking the extension icon, switch to the "Registry" tab to choose an existing registry. You can create registries on thegiddylist.com under your dashboard.',
  },
  {
    q: "Does the extension track my browsing?",
    a: "No. The extension only activates when you click its icon. It reads product info from the current page at that moment and does nothing in the background. See our Privacy Policy for full details.",
  },
];

const TROUBLESHOOTING = [
  {
    issue: "Extension icon is grayed out",
    fix: "The extension only works on regular web pages. It cannot run on Chrome internal pages (chrome://, chrome-extension://), the Chrome Web Store, or blank tabs. Navigate to a product page and try again.",
  },
  {
    issue: "Product info is missing or wrong",
    fix: "Some sites use unusual page structures. Try refreshing the page, then click the extension again. If the issue persists, you can always add the product manually on thegiddylist.com by pasting the URL.",
  },
  {
    issue: '"No kids found" message',
    fix: "You need at least one kid profile to save items. Visit thegiddylist.com, go to your dashboard, and add a kid profile first.",
  },
  {
    issue: "Extension not appearing in toolbar",
    fix: "Click the puzzle-piece icon in Chrome\u2019s toolbar and pin The Giddy List extension so it\u2019s always visible.",
  },
  {
    issue: "Price shows incorrectly",
    fix: "The extension reads the first price it finds on the page. If a product has sale pricing or variants, it may grab the wrong one. You can edit the price on your wishlist at thegiddylist.com.",
  },
];

export default function SupportPage() {
  return (
    <main className="min-h-screen bg-white pb-20 md:pb-0">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Extension Support
        </h1>
        <p className="text-foreground/50 mb-12">
          Help with The Giddy List Chrome extension
        </p>

        {/* Contact */}
        <section className="mb-14">
          <h2 className="text-xl font-semibold text-foreground mb-4">
            Need Help?
          </h2>
          <p className="text-foreground/70 leading-relaxed mb-4">
            If you have a question, bug report, or feature request, email us and
            we&apos;ll get back to you within 24 hours.
          </p>
          <a
            href="mailto:hello@thegiddylist.com"
            className="inline-flex items-center gap-2 rounded-full bg-red px-6 py-3 text-sm font-semibold text-white hover:bg-red-hover transition-all duration-200"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
            hello@thegiddylist.com
          </a>
        </section>

        {/* FAQ */}
        <section className="mb-14">
          <h2 className="text-xl font-semibold text-foreground mb-6">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            {FAQ_ITEMS.map((item) => (
              <div key={item.q}>
                <h3 className="text-base font-semibold text-foreground mb-1.5">
                  {item.q}
                </h3>
                <p className="text-foreground/60 leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Troubleshooting */}
        <section className="mb-14">
          <h2 className="text-xl font-semibold text-foreground mb-6">
            Troubleshooting
          </h2>
          <div className="space-y-5">
            {TROUBLESHOOTING.map((item) => (
              <div
                key={item.issue}
                className="rounded-xl border border-gray-100 bg-gray-50/50 p-5"
              >
                <h3 className="text-base font-semibold text-foreground mb-1.5">
                  {item.issue}
                </h3>
                <p className="text-foreground/60 leading-relaxed text-sm">
                  {item.fix}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Links */}
        <section className="border-t border-gray-100 pt-10">
          <div className="flex flex-wrap gap-6 text-sm">
            <Link
              href="/"
              className="text-red hover:text-red-hover font-medium transition-colors"
            >
              Back to The Giddy List
            </Link>
            <Link
              href="/privacy"
              className="text-foreground/50 hover:text-foreground transition-colors"
            >
              Privacy Policy
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
