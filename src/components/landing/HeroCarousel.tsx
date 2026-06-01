"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Flame,
  Layers3,
  Play,
  Search,
  Trophy,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const HERO_SLIDES = [
  {
    title: "Engleet",
    subtitle: "เรียนอังกฤษแบบสั้น กระชับ และอยากกลับมาเล่นต่อทุกวัน",
    detail:
      "เริ่มจากบทเรียนเล็ก ๆ ทำ quiz เก็บ XP ทบทวนคำศัพท์ และค่อย ๆ สร้าง streak ที่ทำให้การเรียนภาษาเป็นนิสัย",
    image:
      "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1800&q=82",
    accent: "Daily quest",
  },
  {
    title: "Lessons that move",
    subtitle: "อ่านน้อยลง ลงมือทำมากขึ้น",
    detail:
      "บทเรียนถูกแบ่งเป็นช่วงสั้น พร้อมคำศัพท์สำคัญและ quiz เพื่อให้จำได้จริง ไม่ใช่แค่อ่านผ่าน",
    image:
      "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1800&q=82",
    accent: "Micro lesson",
  },
  {
    title: "Vocabulary first",
    subtitle: "คลังคำศัพท์เดียว ใช้ซ้ำได้ทั้ง lesson, news และ selection lookup",
    detail:
      "คำศัพท์เป็น resource กลางของระบบ จึงค้นหา บันทึก ทบทวน และเชื่อมกับเนื้อหาจริงได้โดยไม่ซ้ำซ้อน",
    image:
      "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=1800&q=82",
    accent: "Shared memory",
  },
];

const HERO_STATS = [
  { icon: <Flame className="size-4" />, label: "Streak loop" },
  { icon: <Trophy className="size-4" />, label: "XP feedback" },
  { icon: <Search className="size-4" />, label: "Quick lookup" },
];

export default function HeroCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeSlide = HERO_SLIDES[activeIndex];

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % HERO_SLIDES.length);
    }, 6500);

    return () => window.clearInterval(timer);
  }, []);

  function goToNext() {
    setActiveIndex((current) => (current + 1) % HERO_SLIDES.length);
  }

  function goToPrevious() {
    setActiveIndex(
      (current) => (current - 1 + HERO_SLIDES.length) % HERO_SLIDES.length,
    );
  }

  return (
    <section className="relative isolate min-h-[calc(100svh-8rem)] overflow-hidden bg-foreground text-background">
      {HERO_SLIDES.map((slide, index) => (
        <div
          key={slide.title}
          className={cn(
            "absolute inset-0 transition duration-700",
            index === activeIndex
              ? "scale-100 opacity-100"
              : "scale-[1.02] opacity-0",
          )}
          aria-hidden={index !== activeIndex}
        >
          <Image
            src={slide.image}
            alt=""
            fill
            priority={index === 0}
            sizes="100vw"
            className="object-cover"
          />
        </div>
      ))}
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(5,16,31,0.88),rgba(5,16,31,0.62)_48%,rgba(5,16,31,0.25))]" />
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background/90 to-transparent" />

      <div className="relative z-10 mx-auto flex min-h-[calc(100svh-8rem)] max-w-6xl flex-col justify-center px-4 py-14 sm:px-6">
        <div className="max-w-3xl space-y-6" aria-live="polite">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-sm font-medium text-white shadow-sm backdrop-blur">
            <BookOpen className="size-4" />
            Gamified English learning
            <span className="h-1 w-1 rounded-full bg-white/60" />
            {activeSlide.accent}
          </p>

          <div className="space-y-4">
            <h1 className="text-balance text-5xl font-semibold text-white sm:text-7xl">
              {activeSlide.title}
            </h1>
            <p className="max-w-2xl text-balance text-2xl font-medium leading-snug text-white sm:text-4xl">
              {activeSlide.subtitle}
            </p>
            <p className="max-w-2xl text-base leading-8 text-white/80 sm:text-lg">
              {activeSlide.detail}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              asChild
              size="lg"
              className="bg-white text-black shadow-lg shadow-black/20 transition hover:-translate-y-0.5 hover:bg-white/90"
            >
              <Link href="/learn/lessons">
                <Play />
                เริ่มเรียน
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-white/40 bg-white/10 text-white backdrop-blur hover:bg-white/20 hover:text-white"
            >
              <Link href="/learn/vocabulary">
                <Layers3 />
                ฝึก Flashcards
              </Link>
            </Button>
          </div>

          <div className="grid max-w-2xl gap-2 sm:grid-cols-3">
            {HERO_STATS.map((stat) => (
              <div
                key={stat.label}
                className="flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm font-medium text-white backdrop-blur"
              >
                {stat.icon}
                {stat.label}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={goToPrevious}
              className="focus-ring inline-flex size-10 items-center justify-center rounded-full border border-white/25 bg-white/10 text-white backdrop-blur transition hover:bg-white/20"
              aria-label="Previous hero slide"
            >
              <ArrowLeft className="size-4" />
            </button>
            <button
              type="button"
              onClick={goToNext}
              className="focus-ring inline-flex size-10 items-center justify-center rounded-full border border-white/25 bg-white/10 text-white backdrop-blur transition hover:bg-white/20"
              aria-label="Next hero slide"
            >
              <ArrowRight className="size-4" />
            </button>
          </div>

          <div className="grid w-full max-w-md grid-cols-3 gap-2">
            {HERO_SLIDES.map((slide, index) => (
              <button
                key={slide.title}
                type="button"
                onClick={() => setActiveIndex(index)}
                className="group text-left"
                aria-label={`Hero slide ${index + 1}: ${slide.title}`}
              >
                <span className="block h-1.5 overflow-hidden rounded-full bg-white/20">
                  <span
                    className={cn(
                      "block h-full rounded-full bg-white transition-all duration-500",
                      index === activeIndex ? "w-full" : "w-0 group-hover:w-1/2",
                    )}
                  />
                </span>
                <span
                  className={cn(
                    "mt-2 block truncate text-xs font-medium transition",
                    index === activeIndex ? "text-white" : "text-white/55",
                  )}
                >
                  {slide.accent}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
