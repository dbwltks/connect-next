"use client";

import { Navbar } from "@/components/main/Navbar";
import { Hero } from "@/components/main/Hero";
import { ServiceTimes } from "@/components/main/ServiceTimes";
import { LatestSermons } from "@/components/main/LatestSermons";
import { Community } from "@/components/main/Community";
import { WelcomeForm } from "@/components/main/WelcomeForm";
import { MainPopup } from "@/components/main/MainPopup";
import { Events } from "@/components/main/Events";
import { Photos } from "@/components/main/Photos";
import { TodayWord } from "@/components/main/TodayWord";
import { Videos } from "@/components/main/Videos";
import { Location } from "@/components/main/Location";

interface NewHomepageProps {
  banners?: any[];
  widgets?: any[];
  menuItems?: any[];
}

export default function NewHomepage({ banners, widgets, menuItems }: NewHomepageProps) {
  const locationWidget = widgets?.find(w => w.type === 'location');

  return (
    <div className="min-h-screen bg-white">
      <Navbar menuItems={menuItems} />
      <MainPopup />
      <Hero banners={banners} />
      <ServiceTimes />
      <TodayWord />
      <Events />
      <LatestSermons />
      <Photos />
      <Videos />
      {/* <Community /> */}
      <WelcomeForm />
      <Location data={locationWidget?.display_options} />
    </div>
  );
}
