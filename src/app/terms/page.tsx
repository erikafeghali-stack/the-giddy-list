import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service | The Giddy List",
  description: "Terms of service for The Giddy List website and Chrome extension.",
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-white pb-20 md:pb-0">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Terms of Service
        </h1>
        <p className="text-sm text-foreground/50 mb-10">
          Last updated: February 9, 2026
        </p>

        <div className="prose prose-gray max-w-none text-foreground/80 space-y-8">
          <section>
            <h2 className="text-xl font-semibold text-foreground">
              Agreement to Terms
            </h2>
            <p>
              By accessing or using The Giddy List website (thegiddylist.com),
              Chrome extension, or any related services (collectively, the
              &quot;Service&quot;), you agree to be bound by these Terms of
              Service. If you do not agree to these terms, please do not use the
              Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">
              Description of Service
            </h2>
            <p>
              The Giddy List is a platform that allows parents and families to
              create gift wishlists and registries for their children, and
              enables creators to curate gift guides and earn affiliate
              commissions. Our Chrome extension allows users to save products
              from any online store directly to their wishlists.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">
              User Accounts
            </h2>
            <p>
              To use certain features of the Service, you must create an
              account. You are responsible for maintaining the confidentiality of
              your account credentials and for all activities that occur under
              your account. You must be at least 18 years old to create an
              account. All accounts are managed by parents or guardians, not
              minors.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">
              Wishlists and Registries
            </h2>
            <p>
              You may create wishlists and registries for personal,
              non-commercial use. Product information added to wishlists
              (including titles, images, prices, and URLs) is sourced from
              publicly available retailer pages. We do not guarantee the
              accuracy, availability, or pricing of any products listed. Prices
              and availability are determined by the respective retailers.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">
              Creator Program and Affiliate Links
            </h2>
            <p>
              Creators who curate gift guides may earn affiliate commissions
              when users purchase products through their guide links. Commission
              rates and payment terms are subject to our affiliate program
              policies and may change at any time. We reserve the right to
              suspend or terminate creator accounts that violate our guidelines,
              including but not limited to posting misleading content,
              artificially inflating clicks, or promoting prohibited products.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">
              Chrome Extension
            </h2>
            <p>
              The Giddy List Chrome extension is provided as a convenience to
              save products from retailer websites. The extension accesses
              product information only when you actively click the extension
              icon. By using the extension, you also agree to comply with the{" "}
              <a
                href="https://developer.chrome.com/docs/webstore/program-policies/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-red hover:text-red-hover underline"
              >
                Chrome Web Store Developer Program Policies
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">
              Prohibited Conduct
            </h2>
            <p>You agree not to:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                Use the Service for any unlawful purpose or in violation of
                these Terms
              </li>
              <li>
                Scrape, crawl, or use automated means to access the Service
                beyond normal use
              </li>
              <li>
                Impersonate any person or entity, or misrepresent your
                affiliation
              </li>
              <li>
                Interfere with or disrupt the Service or its infrastructure
              </li>
              <li>
                Upload or share content that is harmful, offensive, or infringes
                on others&apos; rights
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">
              Intellectual Property
            </h2>
            <p>
              The Giddy List name, logo, and all original content on the
              Service are owned by us and protected by applicable intellectual
              property laws. Product images and descriptions belong to their
              respective retailers and are displayed under fair use for
              wishlist/registry purposes.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">
              Disclaimer of Warranties
            </h2>
            <p>
              The Service is provided &quot;as is&quot; and &quot;as
              available&quot; without warranties of any kind, either express or
              implied. We do not guarantee that the Service will be
              uninterrupted, error-free, or secure. We are not responsible for
              the accuracy of product information sourced from third-party
              retailers.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">
              Limitation of Liability
            </h2>
            <p>
              To the fullest extent permitted by law, The Giddy List shall not
              be liable for any indirect, incidental, special, or consequential
              damages arising from your use of the Service, including but not
              limited to lost profits, data loss, or purchase decisions made
              based on information displayed on the platform.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">
              Termination
            </h2>
            <p>
              We may suspend or terminate your access to the Service at any
              time, with or without cause, and with or without notice. Upon
              termination, your right to use the Service ceases immediately. You
              may delete your account at any time through your account settings.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">
              Changes to These Terms
            </h2>
            <p>
              We may update these Terms from time to time. We will notify you
              of any material changes by posting the updated Terms on this page
              and updating the &quot;Last updated&quot; date. Continued use of
              the Service after changes constitutes acceptance of the revised
              Terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">
              Contact Us
            </h2>
            <p>
              If you have questions about these Terms of Service, please contact
              us at{" "}
              <a
                href="mailto:hello@thegiddylist.com"
                className="text-red hover:text-red-hover underline"
              >
                hello@thegiddylist.com
              </a>
              .
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-100">
          <Link
            href="/privacy"
            className="text-sm text-foreground/50 hover:text-foreground transition-colors"
          >
            Privacy Policy
          </Link>
        </div>
      </div>
    </main>
  );
}
