/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Sicherheits-Header für alle Seiten. Fangen die häufigsten Angriffe ab
  // (Clickjacking, MIME-Sniffing, zu viel Referrer-Leak) — ohne dass du
  // etwas konfigurieren musst. Bewusst konservativ gehalten, damit nichts
  // am Prototyp bricht. Eine strikte Content-Security-Policy kommt später,
  // wenn die Seite stabil ist.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "geolocation=(), microphone=(), payment=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
        ],
      },
    ];
  },
};
module.exports = nextConfig;
