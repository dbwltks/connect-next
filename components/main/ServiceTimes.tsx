export function ServiceTimes() {
  const services = [
    {
      name: "주일 예배",
      time: "15:00",
      location: "@별관 체육관",
      day: "일요일",
    },
    {
      name: "목요 기도회",
      time: "19:15",
      location: "@별관 예배실",
      day: "목요일",
    },
    {
      name: "Bible Connect IN",
      time: "19:00",
      location: "@목사관",
      day: "화요일",
    },
    {
      name: "Bible Connect IN",
      time: "17:00",
      location: "@Toronto Public Library",
      day: "목요일",
    },
  ];

  return (
    <section className="min-h-screen bg-white dark:bg-gray-950 flex items-center py-16 sm:py-32">
      <div className="max-w-[1400px] mx-auto px-6 w-full">
        <div className="grid lg:grid-cols-2 gap-10 sm:gap-20 items-center">
          <div>
            <div className="mb-8">
              <span className="text-sm uppercase tracking-[0.3em] text-gray-400 dark:text-gray-500">
                Service Times
              </span>
            </div>
            <h2 className="text-[clamp(2.5rem,5vw,4.5rem)] leading-[1.1] mb-8 tracking-tight font-medium text-black dark:text-white">
              예배와 말씀
              <br />
              시간 안내
            </h2>
            <p className="text-xl text-gray-500 dark:text-gray-400 leading-relaxed">
              함께 예배하며 하나님을 만나는 시간,
              <br />
              말씀의 자리로 여러분을 초대합니다.
            </p>
          </div>

          <div className="space-y-1">
            {services.map((service, index) => (
              <div
                key={index}
                className="group border-b border-gray-200 dark:border-gray-800 py-8 hover:border-black dark:hover:border-white transition-all cursor-pointer"
              >
                <div className="flex justify-between items-start gap-8">
                  <div className="flex-1">
                    <h3 className="text-2xl mb-3 text-black dark:text-white">
                      {service.name}
                    </h3>
                    <div className="flex gap-6 text-gray-500 dark:text-gray-400 text-sm sm:text-base">
                      <span>{service.day}</span>
                      <span>{service.location}</span>
                    </div>
                  </div>
                  <div className="text-4xl tracking-tight text-black dark:text-white group-hover:text-black dark:group-hover:text-white transition-colors">
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
