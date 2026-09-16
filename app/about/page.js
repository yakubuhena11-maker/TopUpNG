import Link from "next/link";

export default function AboutPage() {
  return (
    <main className="wrap main-pad">
      <div style={{ paddingTop: 24 }}>
        <div className="wordmark">
          top<span>up</span>ng
        </div>

        <section className="card-section" style={{ marginTop: 28 }}>
          <div className="card-title">About TopUpNG</div>
          <h1>Simple, instant top-ups for Nigeria.</h1>
          <p className="sub">
            TopUpNG is a convenient platform for Nigerian users to buy mobile
            data and airtime across major networks. Fund your wallet, choose a
            network, and complete your top-up quickly from one simple app.
          </p>
          <p className="sub" style={{ marginBottom: 0 }}>
            We make everyday connectivity easier with a straightforward,
            reliable experience for data and airtime purchases.
          </p>
        </section>

        <section className="card-section">
          <div className="card-title">Contact us</div>
          <p className="sub" style={{ marginBottom: 10 }}>
            Have a question or need help? We&apos;d be happy to hear from you.
          </p>
          <div className="stub" style={{ marginTop: 14 }}>
            <div className="stub-row">
              <span>Email</span>
              <a href="mailto:support@topupng.com" style={{ color: "#fff" }}>
                support@topupng.com
              </a>
            </div>
            <div className="stub-row">
              <span>Address</span>
              <b>Lagos, Nigeria</b>
            </div>
          </div>
        </section>

        <Link href="/login" className="btn" style={{ display: "block", textAlign: "center", textDecoration: "none" }}>
          Get started →
        </Link>
      </div>
    </main>
  );
}
