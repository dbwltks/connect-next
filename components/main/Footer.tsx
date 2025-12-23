import { MapPin, Phone, Mail, Instagram, Youtube, Facebook } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-black text-white py-24">
      <div className="max-w-[1400px] mx-auto px-6">
        <div className="grid md:grid-cols-12 gap-16 mb-20">
          {/* Logo & Description */}
          <div className="md:col-span-4">
            <h3 className="text-3xl mb-6 tracking-tight">새빛</h3>
            <p className="text-white/40 leading-relaxed mb-8">
              함께 성장하는 믿음의 공동체.<br />
              새로운 세대와 함께하는 따뜻한 커뮤니티.
            </p>
            <div className="flex gap-4">
              <a href="#" className="w-12 h-12 border border-white/20 hover:border-white hover:bg-white hover:text-black transition-all flex items-center justify-center">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="w-12 h-12 border border-white/20 hover:border-white hover:bg-white hover:text-black transition-all flex items-center justify-center">
                <Youtube className="w-5 h-5" />
              </a>
              <a href="#" className="w-12 h-12 border border-white/20 hover:border-white hover:bg-white hover:text-black transition-all flex items-center justify-center">
                <Facebook className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Links */}
          <div className="md:col-span-2">
            <h4 className="text-xs uppercase tracking-[0.3em] text-white/40 mb-6">Navigate</h4>
            <div className="space-y-4">
              <a href="#home" className="block text-white/60 hover:text-white transition-colors">Home</a>
              <a href="#about" className="block text-white/60 hover:text-white transition-colors">About</a>
              <a href="#sermons" className="block text-white/60 hover:text-white transition-colors">Sermons</a>
              <a href="#community" className="block text-white/60 hover:text-white transition-colors">Community</a>
              <a href="#events" className="block text-white/60 hover:text-white transition-colors">Events</a>
            </div>
          </div>

          {/* Contact */}
          <div className="md:col-span-6">
            <h4 className="text-xs uppercase tracking-[0.3em] text-white/40 mb-6">Contact</h4>
            <div className="space-y-6 text-white/60">
              <div className="flex gap-4">
                <MapPin className="w-5 h-5 flex-shrink-0 mt-1" />
                <span>서울특별시 강남구 테헤란로 123<br />새빛빌딩 5층</span>
              </div>
              <div className="flex gap-4">
                <Phone className="w-5 h-5 flex-shrink-0" />
                <span>02-1234-5678</span>
              </div>
              <div className="flex gap-4">
                <Mail className="w-5 h-5 flex-shrink-0" />
                <span>contact@newlight.church</span>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 text-white/40 text-sm">
          <p>&copy; 2025 새빛교회. All rights reserved.</p>
          <div className="flex gap-8">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
