import { MapPin, Phone, Mail, Instagram, Youtube, Facebook } from "lucide-react";

const SERVICE_TIMES = [
  { name: "주일 예배", time: "오후 3:00 – 5:00" },
  { name: "목요 기도회", time: "오후 7:00 – 9:00" },
  { name: "화요 Bible Connect IN", time: "오후 7:00 – 8:30" },
  { name: "목요 Bible Connect IN", time: "오후 5:00 – 6:30" },
  { name: "셀 모임 (주일)", time: "오후 5:00 – 6:00" },
];

const NAV_LINKS = [
  { label: "Home", href: "#home" },
  { label: "About", href: "#about" },
  { label: "Sermons", href: "#sermons" },
  { label: "Community", href: "#community" },
  { label: "Events", href: "#events" },
];

const SOCIAL_LINKS = [
  { label: "Instagram", href: "https://instagram.com/torontoconnectchurch", icon: Instagram },
  { label: "YouTube", href: "https://www.youtube.com/@TorontoConnectChurch", icon: Youtube },
  { label: "Facebook", href: "https://facebook.com/groups/tconnectchurch", icon: Facebook },
];

export function Footer() {
  return (
    <footer className="bg-white text-neutral-950 border-t border-neutral-200">
      <div className="max-w-[1400px] mx-auto px-6 md:px-10 py-8 md:py-10">
        {/* Logo + Headline */}
        <div className="mb-10 md:mb-12">
          <img src="/connect_logo.png" alt="Toronto Connect Church" className="h-10 md:h-14 w-auto mb-4" />
          <h2 className="text-[clamp(1.25rem,2.5vw,1.75rem)] leading-[1.4] font-medium tracking-tight">
            Connect with God,<br />
            Connect with You and Me,<br />
            Connect with People and the World.
          </h2>
        </div>

        {/* Info grid */}
        <div className="grid grid-cols-2 md:grid-cols-12 gap-y-10 gap-x-6 pb-8 md:pb-10">
          <div className="md:col-span-3">
            <h4 className="text-xs uppercase tracking-[0.2em] text-neutral-400 mb-5">
              Navigate
            </h4>
            <ul className="space-y-3 text-sm">
              {NAV_LINKS.map((link) => (
                <li key={link.label}>
                  <a href={link.href} className="text-neutral-600 hover:text-neutral-950 transition-colors">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-4">
            <h4 className="text-xs uppercase tracking-[0.2em] text-neutral-400 mb-5">
              Service Times
            </h4>
            <ul className="space-y-3 text-sm">
              {SERVICE_TIMES.map((service) => (
                <li key={service.name} className="flex justify-between gap-4">
                  <span className="text-neutral-600">{service.name}</span>
                  <span className="text-neutral-400 tabular-nums whitespace-nowrap">{service.time}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="col-span-2 md:col-span-5">
            <h4 className="text-xs uppercase tracking-[0.2em] text-neutral-400 mb-5">
              Visit Us
            </h4>
            <ul className="space-y-3 text-sm">
              <li className="flex gap-3 text-neutral-600">
                <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5 text-neutral-400" />
                <span>45 Davenport Road, Toronto, ON M5R 1H2</span>
              </li>
              <li className="flex gap-3">
                <Phone className="w-4 h-4 flex-shrink-0 text-neutral-400" />
                <a href="tel:647-447-9776" className="text-neutral-600 hover:text-neutral-950 transition-colors">
                  647-447-9776
                </a>
              </li>
              <li className="flex gap-3">
                <Mail className="w-4 h-4 flex-shrink-0 text-neutral-400" />
                <a href="mailto:tconnectchurch@gmail.com" className="text-neutral-600 hover:text-neutral-950 transition-colors">
                  tconnectchurch@gmail.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-6 border-t border-neutral-200 flex flex-col-reverse sm:flex-row justify-between items-center gap-4 text-xs text-neutral-400">
          <span>&copy; {new Date().getFullYear()} Toronto Connect Church</span>
          <div className="flex items-center gap-5">
            {SOCIAL_LINKS.map(({ label, href, icon: Icon }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noreferrer"
                aria-label={label}
                className="text-neutral-400 hover:text-neutral-950 transition-colors"
              >
                <Icon className="w-[18px] h-[18px]" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
