import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | The Giddy List",
  description: "Privacy policy for The Giddy List website and Chrome extension.",
};

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-white pb-20 md:pb-0">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Privacy Policy
        </h1>
        <p className="text-sm text-foreground/50 mb-10">
          Last updated: February 2, 2026
        </p>

        <div className="prose prose-gray max-w-none text-foreground/80 space-y-8">
          <section>
            <h2 className="text-xl font-semibold text-foreground">
              Introduction
            </h2>
            <p>
              The Giddy List (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;)
              operates the website thegiddylist.com and The Giddy List - Gift
              Saver Chrome extension. This Privacy Policy explains how we
              collect, use, and protect your information when you use our
              services.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">
              Information We Collect
            </h2>

            <h3 className="text-lg font-medium text-foreground mt-4">
              Account Information
            </h3>
            <p>
              When you create an account, we collect your email address and any
              profile information you choose to provide, such as a display name
              and avatar.
            </p>

            <h3 className="text-lg font-medium text-foreground mt-4">
              Wishlist and Product Data
            </h3>
            <p>
              When you add items to wishlists, we store the product information
              including title, image URL, price, and the retailer URL. This data
              is provided by you or scraped from publicly available product pages
              at your request.
            </p>

            <h3 className="text-lg font-medium text-foreground mt-4">
              Chrome Extension Data
            </h3>
            <p>
              Our Chrome extension collects the following data only when you
              actively click the extension to save a product:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                Product information from the current webpage (title, image,
                price)
              </li>
              <li>
                Authentication cookies to verify your login status on
                thegiddylist.com
              </li>
            </ul>
            <p className="mt-2">
              The extension does not collect browsing history, track your
              activity across websites, or run in the background. It only
              activates when you click the extension icon.
            </p>

            <h3 className="text-lg font-medium text-foreground mt-4">
              Usage Data
            </h3>
            <p>
              We collect anonymous usage data such as page views and feature
              usage to improve our service. This data is not linked to your
              personal identity.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">
              How We Use Your Information
            </h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>To provide and maintain your wishlists and gift guides</li>
              <li>To authenticate your identity when using the extension</li>
              <li>To save products you choose to add to your wishlists</li>
              <li>
                To generate affiliate links when you click through to purchase
                products
              </li>
              <li>To improve our website and extension functionality</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">
              Data Sharing
            </h2>
            <p>
              We do not sell, trade, or transfer your personal information to
              third parties. We may share anonymized, aggregate data for
              analytics purposes. Product clicks may be tracked through
              affiliate programs (such as Amazon Associates) to earn referral
              commissions, but no personal data is shared with these programs.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">
              Data Storage and Security
            </h2>
            <p>
              Your data is stored securely using Supabase, which provides
              encrypted database storage and authentication. We use HTTPS for
              all data transmission and follow industry-standard security
              practices.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">
              Your Rights
            </h2>
            <p>You have the right to:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Access the personal data we hold about you</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion of your account and associated data</li>
              <li>Export your wishlist data</li>
            </ul>
            <p className="mt-2">
              To exercise any of these rights, please contact us at
              hello@thegiddylist.com.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">Cookies</h2>
            <p>
              We use cookies for authentication purposes to keep you logged in.
              The Chrome extension reads these cookies solely to verify your
              login status. We do not use cookies for advertising or
              cross-site tracking.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">
              Children&apos;s Privacy
            </h2>
            <p>
              While our service helps parents manage gift wishlists for their
              children, we do not knowingly collect personal information from
              children under 13. All accounts are created and managed by parents
              or guardians.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">
              Changes to This Policy
            </h2>
            <p>
              We may update this Privacy Policy from time to time. We will
              notify you of any changes by posting the new policy on this page
              and updating the &quot;Last updated&quot; date.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">
              Contact Us
            </h2>
            <p>
              If you have questions about this Privacy Policy, please contact us
              at hello@thegiddylist.com.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
