export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-[#1A1A1F] text-[#E5E5E5] font-light py-20 px-6">
      <div className="max-w-3xl mx-auto space-y-12">
        <header className="space-y-4">
          <div className="w-10 h-10 bg-[#F5E642] rounded-sm flex items-center justify-center shadow-lg shadow-[#F5E642]/10 mb-6">
            <span className="text-[#1A1A1F] font-black text-xl">V</span>
          </div>
          <h1 className="text-4xl font-bold text-white tracking-tight">Privacy Policy - VibeRef</h1>
          <p className="text-[#888] text-sm">Last updated: May 5, 2026</p>
        </header>

        <section className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-[#F5E642] uppercase tracking-wider text-sm">1. What we collect</h2>
            <div className="space-y-4 text-[#C8C8C8] leading-relaxed">
              <p>
                To provide our design reference management service, we collect the following information:
              </p>
              <ul className="list-disc list-inside space-y-1 pl-4">
                <li>Email address (for authentication and service-related communication)</li>
                <li>URLs of images and websites you save as references</li>
                <li>Metadata related to your saved items (titles, memos, tags, and collections)</li>
                <li>Screenshot images generated or uploaded by you</li>
              </ul>
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-bold text-[#F5E642] uppercase tracking-wider text-sm">2. How we use your data</h2>
            <p className="text-[#C8C8C8] leading-relaxed">
              The information we collect is used <strong>only to provide and improve the VibeRef service</strong>. This includes managing your personal dashboard, syncing data with our browser extension, and facilitating design organization through AI-powered features (future). We do not use your data for advertising or tracking outside of our platform.
            </p>
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-bold text-[#F5E642] uppercase tracking-wider text-sm">3. Third party sharing</h2>
            <p className="text-[#C8C8C8] leading-relaxed">
              We do not sell, trade, or otherwise transfer your personal information to outside parties. This does not include trusted third parties who assist us in operating our service, as long as those parties agree to keep this information confidential.
            </p>
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-bold text-[#F5E642] uppercase tracking-wider text-sm">4. Data storage & Security</h2>
            <p className="text-[#C8C8C8] leading-relaxed">
              Your data is securely stored using industry-standard infrastructure:
            </p>
            <ul className="list-disc list-inside space-y-1 pl-4 text-[#C8C8C8]">
              <li><strong>Supabase</strong>: Database management and authentication</li>
              <li><strong>Cloudflare R2</strong>: Secure storage for screenshot images</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-bold text-[#F5E642] uppercase tracking-wider text-sm">5. Contact</h2>
            <p className="text-[#C8C8C8] leading-relaxed">
              If you have any questions regarding this privacy policy, you may contact us at:
              <br />
              <a href="mailto:hello@nextidealab.app" className="text-[#F5E642] hover:underline mt-2 inline-block">hello@nextidealab.app</a>
            </p>
          </div>
        </section>

        <footer className="pt-12 border-t border-[#2A2A32]">
          <a href="/dashboard" className="text-sm text-[#888] hover:text-[#F5E642] transition-colors flex items-center gap-2">
            ← Back to Dashboard
          </a>
        </footer>
      </div>
    </div>
  )
}
