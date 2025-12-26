interface LocationProps {
  data?: {
    location_title?: string;
    location_subtitle?: string;
    address?: string;
    phone?: string;
    email?: string;
    embed_map_url?: string;
  };
}

export function Location({ data }: LocationProps) {
  const address = data?.address || "45 Davenport Rd, Toronto, ON M5R 1H2";
  const phone = data?.phone || "416-921-1718";
  const email = data?.email || "connectchurchtoronto@gmail.com";
  const embedUrl = "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2885.601550917232!2d-79.3916297232777!3d43.6730595515324!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x882b34a6feddf98d%3A0x7d6c6e75a3de3e0!2s45%20Davenport%20Rd%2C%20Toronto%2C%20ON%20M5R%201H2!5e0!3m2!1sko!2sca!4v1703350000000!5m2!1sko!2sca";

  return (
    <section id="location" className="bg-white dark:bg-gray-950 py-16">
      <div className="max-w-[1400px] mx-auto px-6">
        <div className="mb-12">
          <span className="text-sm uppercase tracking-[0.3em] text-gray-400 dark:text-gray-500 ">Location</span>
          <h2 className="text-[clamp(2.5rem,5vw,4.5rem)] leading-[1.1] font-medium mt-6 mb-4 tracking-tight text-black dark:text-white">
            {data?.location_title || "오시는 길"}
          </h2>
          <p className="text-xl text-gray-500 dark:text-gray-400">
            {data?.location_subtitle || "언제든 방문을 환영합니다"}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-16 items-stretch">
          {/* Map */}
          <div className="relative overflow-hidden bg-gray-100 dark:bg-gray-800 h-[350px] md:h-auto min-h-full">
            <iframe
              src={embedUrl}
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            ></iframe>
          </div>

          {/* Contact Information */}
          <div className="space-y-8">
            <div>
              <div className="text-xs uppercase tracking-[0.3em] text-gray-400 dark:text-gray-500 mb-4">Address</div>
              <div>
                <p className="text-2xl mb-2 text-black dark:text-white">Connect Church</p>
                <p className="text-xl text-gray-500 dark:text-gray-400">{address}</p>
              </div>
            </div>

            <div>
              <div className="text-xs uppercase tracking-[0.3em] text-gray-400 dark:text-gray-500 mb-4">Contact</div>
              <div className="space-y-3">
                <div className="text-xl text-black dark:text-white">{phone}</div>
                <div className="text-xl text-black dark:text-white">{email}</div>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
              <div className="text-xs uppercase tracking-[0.3em] text-gray-400 dark:text-gray-500 mb-4">Directions</div>
              <div className="space-y-3 text-gray-600 dark:text-gray-400">
                <p>블로어-영(Bloor-Yonge) 전철역 또는 베이(Bay) 전철역에서 한 블럭 북쪽으로 오셔서 Davenport Rd를 만나 45번지를 찾으면 됩니다.</p>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
              <div className="text-xs uppercase tracking-[0.3em] text-gray-400 dark:text-gray-500 mb-4">Parking</div>
              <div className="space-y-3 text-gray-600 dark:text-gray-400">
                <p>40 Scollard St, Toronto, ON M5R 3S1</p>
                <p className="font-medium text-black dark:text-white">아파트 지하 주차장 입구 판넬의 녹색 버튼을 누르시면 됩니다. <br></br>주차장 입구는 건물 뒤 Scollard Street에 있습니다.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
