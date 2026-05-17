import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy | Vedic Jyotish",
  description: "Privacy Policy for Vedic Jyotish — Learn how we handle your birth data, what third-party services we use, and your rights under GDPR and India's DPDPA.",
};

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="mb-10">
    <h2 className="text-xl font-heading text-primary mb-4 pb-2 border-b border-primary/20 tracking-widest uppercase">
      {title}
    </h2>
    <div className="space-y-3 font-serif text-foreground/80 leading-relaxed text-sm">
      {children}
    </div>
  </section>
);

const ThirdParty = ({
  name,
  role,
  data,
  policy,
  risk,
}: {
  name: string;
  role: string;
  data: string;
  policy: string;
  risk: "Low" | "Medium" | "High";
}) => {
  const riskColor =
    risk === "Low"
      ? "text-emerald-700 bg-emerald-100"
      : risk === "Medium"
        ? "text-amber-700 bg-amber-100"
        : "text-red-700 bg-red-100";

  return (
    <div className="glass-parchment rounded-xl p-5 vedic-border mb-4">
      <div className="flex items-start justify-between gap-4 mb-2 flex-wrap">
        <h3 className="font-heading text-primary text-sm tracking-wider">{name}</h3>
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${riskColor}`}>
          Privacy Risk: {risk}
        </span>
      </div>
      <p className="text-xs text-muted-foreground mb-1"><strong>Role:</strong> {role}</p>
      <p className="text-xs text-muted-foreground mb-1"><strong>Data Received:</strong> {data}</p>
      <a
        href={policy}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs text-primary underline underline-offset-2 hover:opacity-70 transition-opacity"
      >
        View Privacy Policy →
      </a>
    </div>
  );
};

export default function PrivacyPolicyPage() {
  const lastUpdated = "17 May 2025";

  return (
    <main className="min-h-screen selection:bg-primary/30 selection:text-primary">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 md:py-16">

        {/* Header */}
        <div className="text-center mb-12">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-heading text-muted-foreground hover:text-primary transition-colors tracking-widest uppercase mb-8"
          >
            ← Back to Vedic Jyotish
          </Link>
          <h1 className="text-4xl md:text-5xl font-heading gold-glow mb-3">
            Privacy Policy
          </h1>
          <div className="flex items-center justify-center gap-4 text-secondary/80 font-serif tracking-[0.2em] uppercase text-xs mb-4">
            <span className="h-px w-8 bg-secondary/30" />
            Vedic Jyotish — Ancient Wisdom, Modern Integrity
            <span className="h-px w-8 bg-secondary/30" />
          </div>
          <p className="text-xs font-serif text-muted-foreground">
            Last Updated: {lastUpdated} &nbsp;|&nbsp; Effective Date: {lastUpdated}
          </p>
        </div>

        <div className="glass-parchment rounded-3xl vedic-border p-8 md:p-12">

          {/* Introduction */}
          <Section title="1. Introduction">
            <p>
              Welcome to <strong className="text-primary">Vedic Jyotish</strong> ("we", "our", or "us"), an open-source, AI-powered Vedic astrology analysis platform. This Privacy Policy explains how we collect, use, share, and protect your personal information when you use the Vedic Jyotish web application and Android application (collectively, the "Service").
            </p>
            <p>
              By using the Service and clicking "I Understand — Agree & Proceed" on our consent screen, you acknowledge that you have read and understood this Privacy Policy and consent to its terms.
            </p>
            <p>
              This policy complies with the <strong>European Union General Data Protection Regulation (GDPR)</strong> and India's <strong>Digital Personal Data Protection Act, 2023 (DPDPA)</strong>.
            </p>
          </Section>

          {/* Data We Collect */}
          <Section title="2. Information We Collect">
            <p>We collect only the minimum data necessary to provide astrological calculations. We collect the following categories of information:</p>
            <div className="space-y-2 mt-2">
              <div className="flex gap-3 items-start">
                <span className="mt-1 w-2 h-2 rounded-full bg-primary/60 flex-shrink-0" />
                <div>
                  <strong className="text-foreground">Birth Date &amp; Time</strong>
                  <p className="text-xs mt-0.5">The date and time of birth you enter into the form. This is used exclusively to calculate planetary positions using the Swiss Ephemeris library running on our server. We do <strong>not</strong> store this data in any database.</p>
                </div>
              </div>
              <div className="flex gap-3 items-start">
                <span className="mt-1 w-2 h-2 rounded-full bg-primary/60 flex-shrink-0" />
                <div>
                  <strong className="text-foreground">Birth City / Location</strong>
                  <p className="text-xs mt-0.5">The city name or geographic coordinates (latitude/longitude) you enter. The city name text is sent to the Photon Geocoding API (see Section 4) to resolve coordinates. Coordinates are used solely for timezone and planetary calculations.</p>
                </div>
              </div>
              <div className="flex gap-3 items-start">
                <span className="mt-1 w-2 h-2 rounded-full bg-amber-600/60 flex-shrink-0" />
                <div>
                  <strong className="text-foreground">Computed Astrological Chart Data</strong>
                  <p className="text-xs mt-0.5">Planetary positions, house placements, and Dasha timelines derived from your birth details. This computed data (not your raw birth date) is transmitted to Google Gemini AI to generate your report. See Section 4 for details.</p>
                </div>
              </div>
              <div className="flex gap-3 items-start">
                <span className="mt-1 w-2 h-2 rounded-full bg-primary/30 flex-shrink-0" />
                <div>
                  <strong className="text-foreground">Technical Data (Automatic)</strong>
                  <p className="text-xs mt-0.5">Standard server logs may include your IP address and browser user agent. These are retained for a maximum of 7 days for security and debugging purposes only and are never linked to your astrological data.</p>
                </div>
              </div>
            </div>
          </Section>

          {/* How We Use Data */}
          <Section title="3. How We Use Your Information">
            <p>We use the information you provide for the following purposes:</p>
            <ul className="list-disc list-outside ml-5 space-y-1 mt-2">
              <li>To perform high-precision Vedic astrological calculations (Swiss Ephemeris).</li>
              <li>To generate an AI-powered astrological interpretation report via Google Gemini.</li>
              <li>To power the "Chat with Astrologer" conversational feature via Google Gemini.</li>
              <li>To resolve your city name to geographic coordinates via the Photon Geocoding API.</li>
              <li>To ensure the security and reliability of the Service.</li>
            </ul>
            <p className="mt-3 font-semibold text-foreground">
              We do NOT use your data for advertising, profiling, selling to third parties, or any purpose beyond providing the astrological service described above.
            </p>
          </Section>

          {/* Third Party Services */}
          <Section title="4. Third-Party Services & Data Sharing">
            <p>
              We use the following third-party services to operate the Service. Each service receives only the minimum data necessary for its specific function. We do not sell your data to any third party.
            </p>
            <div className="mt-4">
              <ThirdParty
                name="Google Gemini API (Google LLC, USA)"
                role="AI report generation and conversational astrology chat."
                data="Computed astrological chart data (planetary positions, houses, nakshatras, dashas). Your raw birth date, name, or email are NOT sent."
                policy="https://ai.google.dev/gemini-api/terms"
                risk="Medium"
              />
              <ThirdParty
                name="Photon Geocoding API (Komoot GmbH, Germany)"
                role="Resolving city name text to geographic coordinates (latitude/longitude)."
                data="Only the city name string you type (e.g., 'Mumbai'). No birth date, time, or personal identifiers are ever transmitted."
                policy="https://photon.komoot.io/"
                risk="Low"
              />
              <ThirdParty
                name="Hugging Face Spaces (Hugging Face Inc., USA)"
                role="Hosting the backend API server (FastAPI)."
                data="Processes all API requests. Standard server logs may include your IP address. Hugging Face does not have access to your processed astrological data beyond transient request handling."
                policy="https://huggingface.co/privacy"
                risk="Low"
              />
              <ThirdParty
                name="Cloudflare Pages (Cloudflare Inc., USA)"
                role="Hosting and delivering the frontend web application globally via CDN."
                data="Standard CDN data: IP address, browser type, and page request logs for performance and security. No astrological data is processed by Cloudflare."
                policy="https://www.cloudflare.com/privacypolicy/"
                risk="Low"
              />
            </div>

            <div className="mt-2 p-4 rounded-xl bg-amber-50 border border-amber-200">
              <p className="text-xs text-amber-800">
                <strong>Important Note on Google Gemini Free Tier:</strong> The current version of this Service uses the Google Gemini API Free Tier (Google AI Studio). Under Google's current terms, data sent via the free tier may be used by Google to improve their AI models. Your chart data (which encodes your birth moment) is therefore subject to Google's data practices. We recommend reviewing Google's AI Studio Terms of Service. We plan to upgrade to the paid tier (which restricts Google from using your data for training) in a future release.
              </p>
            </div>
          </Section>

          {/* Data Retention */}
          <Section title="5. Data Retention & Storage">
            <p>
              <strong className="text-foreground">We do not operate a user database.</strong> We have no accounts, no login system, and no persistent storage of personal or astrological data. Specifically:
            </p>
            <ul className="list-disc list-outside ml-5 space-y-1 mt-2">
              <li>Your birth details exist only in your browser's memory for the duration of your active session.</li>
              <li>When you close or refresh the browser tab, all session data is permanently deleted from your browser.</li>
              <li>No birth data, chart data, or report content is written to any database or file on our servers.</li>
              <li>Server access logs (IP address, timestamp) are retained for a maximum of 7 days for security purposes, then automatically deleted.</li>
            </ul>
          </Section>

          {/* User Rights */}
          <Section title="6. Your Rights">
            <p>Depending on your jurisdiction, you may have the following rights regarding your personal data:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
              {[
                { right: "Right to Access", desc: "Request a copy of the data we hold about you." },
                { right: "Right to Erasure", desc: "Request deletion of your data ('right to be forgotten')." },
                { right: "Right to Withdraw Consent", desc: "Stop using the service at any time. No data is retained after your session ends." },
                { right: "Right to Data Portability", desc: "Receive your data in a structured, machine-readable format." },
                { right: "Right to Object", desc: "Object to processing of your data for any purpose." },
                { right: "DPDPA Rights (India)", desc: "All rights under India's Digital Personal Data Protection Act, 2023 are honoured." },
              ].map((item) => (
                <div key={item.right} className="p-3 rounded-lg bg-primary/5 border border-primary/10">
                  <p className="text-xs font-bold text-primary mb-1">{item.right}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
              ))}
            </div>
            <p className="mt-4">
              To exercise any of these rights, please contact us at the email address listed in Section 9. Given that we retain no persistent database, most requests can be fulfilled by simply closing your browser session.
            </p>
          </Section>

          {/* Children */}
          <Section title="7. Children's Privacy">
            <p>
              The Service is not directed to children under the age of 13 (or 16 in the European Union). We do not knowingly collect personal information from children. If you believe a child has provided us with personal information, please contact us immediately and we will take steps to delete such information.
            </p>
          </Section>

          {/* Security */}
          <Section title="8. Security">
            <p>
              We implement the following security measures to protect your data in transit:
            </p>
            <ul className="list-disc list-outside ml-5 space-y-1 mt-2">
              <li>All communications between your browser and our servers are encrypted using <strong>HTTPS/TLS</strong>.</li>
              <li>The backend API enforces rate limiting (via SlowAPI) to prevent abuse.</li>
              <li>Input validation is performed on all user-submitted data before processing.</li>
              <li>No sensitive data is logged in production mode.</li>
            </ul>
            <p className="mt-3">
              However, no method of transmission over the internet is 100% secure. We cannot guarantee absolute security of data transmitted to our Service.
            </p>
          </Section>

          {/* Contact */}
          <Section title="9. Contact Us">
            <p>
              If you have questions about this Privacy Policy, wish to exercise your data rights, or have concerns about data handling, please contact:
            </p>
            <div className="mt-3 p-4 glass-parchment rounded-xl vedic-border">
              <p className="text-xs"><strong className="text-primary">Project:</strong> Vedic Jyotish</p>
              <p className="text-xs mt-1">
                <strong className="text-primary">GitHub Issues &amp; Contact:</strong>{" "}
                <a href="https://github.com/Dhruvil-8/VedicJyotish/issues" target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2">
                  github.com/Dhruvil-8/VedicJyotish/issues
                </a>
              </p>
              <p className="text-xs mt-2 text-muted-foreground">
                Please open a GitHub Issue labelled <strong>"Privacy"</strong> for any data-related enquiries. We aim to respond within <strong>30 days</strong>.
              </p>
            </div>
          </Section>

          {/* Changes */}
          <Section title="10. Changes to This Policy">
            <p>
              We may update this Privacy Policy from time to time to reflect changes in our practices or legal requirements. When we make material changes, we will update the "Last Updated" date at the top of this page. Continued use of the Service after any changes constitutes acceptance of the updated policy. We encourage you to review this page periodically.
            </p>
          </Section>

          {/* Legal Disclaimer */}
          <Section title="11. Astrological Disclaimer">
            <p>
              The astrological interpretations generated by this Service are produced by an AI system and are intended for <strong>educational and informational purposes only</strong>. They do not constitute professional astrological, psychological, medical, legal, financial, or life advice.
            </p>
            <p>
              Vedic astrology is a traditional system of knowledge rooted in ancient Indian scripture. AI-generated interpretations are approximations and may not reflect the nuanced analysis of a qualified human Jyotishi. Do not make critical life decisions based solely on the output of this tool.
            </p>
          </Section>

        </div>

        {/* Footer */}
        <footer className="mt-12 text-center space-y-3">
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-primary text-primary-foreground font-heading text-sm rounded-full shadow-lg hover:shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            ← Return to Vedic Jyotish
          </Link>
          <p className="text-xs font-serif text-muted-foreground opacity-60 tracking-widest uppercase">
            © 2026 Vedic Jyotish • Powered by Swiss Ephemeris &amp; Gemini AI
          </p>
        </footer>

      </div>
    </main>
  );
}
