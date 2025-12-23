import { Heart, Book, Music, Coffee } from "lucide-react";

export function Community() {
  const groups = [
    {
      name: "청년부",
      description: "20-30대 청년들의 활기찬 모임",
      icon: Heart,
      members: "50+",
      day: "매주 일요일",
    },
    {
      name: "성경 스터디",
      description: "말씀을 깊이 묵상하는 소그룹",
      icon: Book,
      members: "30+",
      day: "매주 화요일",
    },
    {
      name: "찬양팀",
      description: "함께 하나님을 찬양하는 팀",
      icon: Music,
      members: "20+",
      day: "매주 토요일",
    },
    {
      name: "커피 & 토크",
      description: "매주 목요일 편안한 나눔의 시간",
      icon: Coffee,
      members: "40+",
      day: "매주 목요일",
    },
  ];

  return (
    <section id="community" className="bg-white py-16">
      <div className="max-w-[1400px] mx-auto px-6">
        <div className="mb-16">
          <span className="text-sm uppercase tracking-[0.3em] text-gray-400">Community</span>
          <h2 className="text-[clamp(2.5rem,5vw,4.5rem)] leading-[1.1] mt-6 mb-6 tracking-tight">
            커뮤니티
          </h2>
          <p className="text-xl text-gray-500 max-w-2xl">
            함께 모여 교제하고 성장하는 공동체. 당신에게 맞는 그룹을 찾아보세요.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {groups.map((group, index) => {
            const Icon = group.icon;
            return (
              <div
                key={index}
                className="group cursor-pointer"
              >
                <div className="bg-gray-50 p-12 hover:bg-black transition-all duration-500 h-full flex flex-col">
                  <Icon className="w-10 h-10 mb-8 group-hover:text-white transition-colors" />
                  <h3 className="text-2xl mb-4 group-hover:text-white transition-colors">{group.name}</h3>
                  <p className="text-gray-500 mb-6 group-hover:text-white/60 transition-colors leading-relaxed flex-1">
                    {group.description}
                  </p>
                  <div className="flex justify-between items-center text-sm text-gray-400 group-hover:text-white/40 transition-colors uppercase tracking-widest">
                    <span>{group.members}</span>
                    <span>{group.day}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}