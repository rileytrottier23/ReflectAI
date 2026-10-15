import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const CONTACT_EMAIL = "riley.a.trottier@gmail.com";
const EFFECTIVE_DATE = "October 15, 2026";

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="text-xl font-semibold text-black mb-4">{title}</h2>
      <div className="space-y-4 text-gray-700">{children}</div>
    </section>
  );
}

function Bullets({ items }: { items: ReactNode[] }) {
  return (
    <ul className="list-disc pl-6 space-y-2">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
}

const mail = (
  <a href={`mailto:${CONTACT_EMAIL}`} className="text-sage-700 underline">
    {CONTACT_EMAIL}
  </a>
);

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-beige-50 to-sage-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6">
          <Link href="/">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>

        <Card className="border-beige-300 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-3xl font-display font-bold text-black text-center">
              Privacy Policy
            </CardTitle>
            <p className="text-center text-sm text-gray-500">Effective {EFFECTIVE_DATE}</p>
          </CardHeader>
          <CardContent className="prose prose-gray max-w-none">
            <Section title="The short version">
              <Bullets
                items={[
                  "Your journal is yours. It is never sold, never used for advertising, and never shared with anyone except the services listed below that ReflectAI needs to run.",
                  "Your entries are sent to an AI provider (Anthropic) only when you ask for a monthly or annual report.",
                  "ReflectAI has no ads, no analytics, and no tracking cookies.",
                  <>You can delete any entry at any time, and you can ask for your whole account to be deleted by emailing {mail}.</>,
                ]}
              />
            </Section>

            <Section title="Who runs ReflectAI">
              <p>
                ReflectAI (reflectai.net) is a free web app built and run by Riley Trottier, an individual
                based in Victoria, British Columbia, Canada. In this policy, "we" means Riley. Questions about
                your privacy go to {mail}.
              </p>
            </Section>

            <Section title="What we collect">
              <Bullets
                items={[
                  <><strong>Account details:</strong> your name and email address. If you sign up with a password, it is stored only as a secure hash. If you sign in with Google, we receive your name, email address and profile picture from Google.</>,
                  <><strong>Your journal:</strong> the date, text and 1–10 happiness score of each entry you write.</>,
                  <><strong>Your reports:</strong> the monthly and annual reports generated from your entries, so you can read them again later.</>,
                  <><strong>Sign-in sessions:</strong> to keep you signed in, we store a session record with the IP address and browser type (user agent) it was created from. One essential cookie holds your session; there are no other cookies.</>,
                  <><strong>Basic server logs:</strong> the time, page or API address and result of each request, kept by our hosting provider to run and debug the service. These logs do not contain your journal text.</>,
                ]}
              />
              <p>We do not collect your precise location, contacts, or anything from your device beyond what your browser sends with each request.</p>
            </Section>

            <Section title="How we use it">
              <Bullets
                items={[
                  "To run your account and show you your journal.",
                  "To generate the AI reports you ask for.",
                  "To send account emails: confirming your address and resetting your password. We do not send marketing email.",
                  "To keep the service secure and fix problems.",
                ]}
              />
              <p>We do not read your journal entries. As the operator, Riley has technical access to the database and would only look at your data if you ask for help with your account, or if the law requires it.</p>
            </Section>

            <Section title="Services that handle your data">
              <p>ReflectAI relies on these providers. Each one processes data only to provide its service to ReflectAI:</p>
              <Bullets
                items={[
                  <><strong>Railway</strong> hosts the app and its database in the United States (Virginia). All of the data above is stored there. <a className="text-sage-700 underline" href="https://railway.com/legal/privacy" target="_blank" rel="noreferrer">Railway privacy policy</a></>,
                  <><strong>Anthropic</strong> provides the AI model (Claude) that writes your reports. When you request a report, the entries for that month or year are sent to Anthropic's API to generate it. Anthropic's commercial terms do not allow it to train its models on this data by default. <a className="text-sage-700 underline" href="https://www.anthropic.com/legal/privacy" target="_blank" rel="noreferrer">Anthropic privacy policy</a></>,
                  <><strong>Resend</strong> delivers account emails, so it receives your email address and the email's contents. <a className="text-sage-700 underline" href="https://resend.com/legal/privacy-policy" target="_blank" rel="noreferrer">Resend privacy policy</a></>,
                  <><strong>Google</strong>, only if you choose "Continue with Google", confirms who you are. <a className="text-sage-700 underline" href="https://policies.google.com/privacy" target="_blank" rel="noreferrer">Google privacy policy</a></>,
                ]}
              />
              <p>
                Because these providers are in the United States, your information is stored and processed
                outside Canada and may be accessible to US authorities under US law.
              </p>
              <p>
                We will also disclose information if the law requires it, for example in response to a valid
                court order. We do not sell or rent your information to anyone.
              </p>
            </Section>

            <Section title="AI reports are not professional advice">
              <p>
                ReflectAI's reports are written by an AI and can be wrong. They are not medical, psychological
                or counselling advice. If you are struggling, please reach out to a health professional or a
                local crisis line.
              </p>
            </Section>

            <Section title="How long we keep it">
              <Bullets
                items={[
                  "Journal entries and reports are kept until you delete them or ask us to delete your account.",
                  "Deleting an entry in the app removes it from the database right away.",
                  <>To delete your whole account and everything in it, email {mail} from the address on your account. We will delete it within 30 days and confirm when it is done.</>,
                  "Sign-in sessions expire automatically. Hosting logs are kept by Railway for a limited period and then deleted.",
                ]}
              />
            </Section>

            <Section title="Your rights">
              <p>
                You can ask to see the personal information we hold about you, correct it, get a copy of your
                entries, or have it deleted. Email {mail} and we will respond within 30 days. ReflectAI follows
                British Columbia's Personal Information Protection Act. If you are not satisfied with our
                response, you can contact the{" "}
                <a className="text-sage-700 underline" href="https://www.oipc.bc.ca" target="_blank" rel="noreferrer">
                  Office of the Information and Privacy Commissioner for British Columbia
                </a>.
              </p>
            </Section>

            <Section title="How we protect it">
              <Bullets
                items={[
                  "All traffic to reflectai.net is encrypted with HTTPS.",
                  "Passwords are stored as hashes, never in plain text, and email addresses must be confirmed before an account can be used.",
                  "Every request for journal data is checked against the signed-in account, so you can only ever see your own entries.",
                ]}
              />
              <p>
                Your entries are not end-to-end encrypted, which is what lets the AI read them when you ask
                for a report. No online service is perfectly secure. If a breach ever affects your information,
                we will tell you as the law requires.
              </p>
            </Section>

            <Section title="Children">
              <p>
                ReflectAI is not intended for anyone under 18, and we do not knowingly collect information from
                them. If you believe a minor has created an account, contact {mail} and we will delete it.
              </p>
            </Section>

            <Section title="Changes to this policy">
              <p>
                If we change this policy, we will update it here and change the effective date at the top.
                For any significant change, we will also email account holders before it takes effect.
              </p>
            </Section>

            <Section title="Contact">
              <p>Riley Trottier, Victoria, British Columbia, Canada · {mail}</p>
            </Section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
