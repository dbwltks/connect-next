export function ServiceTimes() {
  const services = [
    {
      name: "주일 예배",
      time: "15:00",
      location: "별관 체육관",
      day: "일요일",
    },
    {
      name: "목요 기도회",
      time: "19:15",
      location: "별관 예배실",
      day: "목요일",
    },
    {
      name: "Bible Connect IN",
      time: "19:00",
      location: "목사관",
      day: "화요일",
    },
    {
      name: "Bible Connect IN",
      time: "17:00",
      location: "Toronto Public Library",
      day: "목요일",
    },
  ];

  return (
    <section className="min-h-screen bg-white flex items-center py-32">
      <div className="max-w-[1400px] mx-auto px-6 w-full">
        <div className="grid lg:grid-cols-2 gap-20 items-center">
          <div>
            <div className="mb-8">
              <span className="text-sm uppercase tracking-[0.3em] text-gray-400">Service Times</span>
            </div>
            <h2 className="text-[clamp(2.5rem,5vw,4.5rem)] leading-[1.1] mb-8 tracking-tight">
              당신을<br />
              환영합니다
            </h2>
            <p className="text-xl text-gray-500 leading-relaxed">
              언제든 편하게 방문해주세요.<br />
              여러분의 시간에 맞는 예배와 말씀 모임을 찾아보세요.
            </p>
          </div>

          <div className="space-y-1">
            {services.map((service, index) => (
              <div
                key={index}
                className="group border-b border-gray-200 py-8 hover:border-black transition-all cursor-pointer"
              >
                <div className="flex justify-between items-start gap-8">
                  <div className="flex-1">
                    <h3 className="text-2xl mb-3">{service.name}</h3>
                    <div className="flex gap-6 text-gray-500 text-sm sm:text-base">
                      <span>{service.day}</span>
                      <span>{service.location}</span>
                    </div>
                  </div>
                  <div className="text-4xl tracking-tight group-hover:text-black transition-colors">
                    {service.time}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
