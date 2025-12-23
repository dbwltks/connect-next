"use client";

import { useState } from "react";

export function WelcomeForm() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to send email");
      }

      setIsSubmitted(true);
      setFormData({ name: "", email: "", phone: "", message: "" });
      
      setTimeout(() => {
        setIsSubmitted(false);
      }, 5000);
    } catch (error) {
      console.error("Submission error:", error);
      alert("전송 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="welcome" className="bg-black text-white py-16 md:py-24">
      <div className="max-w-[1400px] mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-12 md:gap-16">
          <div>
            <h3 className="text-[clamp(2rem,4vw,3.5rem)] leading-[1.1] mb-8 tracking-tight">
              새로운 가족을<br />환영합니다
            </h3>
            <p className="text-xl text-white/60 mb-12 leading-relaxed">
              교회에 궁금한 점이 있으신가요?<br />
              말씀을 남겨주시면 정성껏 답변해 드리겠습니다.
            </p>
          </div>
          <div>
            {isSubmitted ? (
              <div className="flex items-center justify-center h-full min-h-[400px]">
                <div className="text-center animate-in fade-in zoom-in duration-500">
                  <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <div className="text-4xl text-white">✓</div>
                  </div>
                  <h4 className="text-2xl mb-4 font-medium">소중한 메시지가 전달되었습니다.</h4>
                  <p className="text-white/60">기입해주신 이메일로 확인 메일을 보내드렸습니다.<br />빠른 시일 내에 연락드리겠습니다.</p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs uppercase tracking-[0.3em] text-white/40 mb-3">
                      Name
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-white/5 border border-white/20 px-6 py-4 text-white placeholder-white/30 focus:border-white focus:outline-none transition-colors"
                      placeholder="이름"
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-[0.3em] text-white/40 mb-3">
                      Phone
                    </label>
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full bg-white/5 border border-white/20 px-6 py-4 text-white placeholder-white/30 focus:border-white focus:outline-none transition-colors"
                      placeholder="000-0000-0000"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-[0.3em] text-white/40 mb-3">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-white/5 border border-white/20 px-6 py-4 text-white placeholder-white/30 focus:border-white focus:outline-none transition-colors"
                    placeholder="example@email.com"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-[0.3em] text-white/40 mb-3">
                    Message
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full bg-white/5 border border-white/20 px-6 py-4 text-white placeholder-white/30 focus:border-white focus:outline-none transition-colors resize-none"
                    placeholder="궁금하신 내용이나 남기고 싶은 말씀을 자유롭게 적어주세요."
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full px-12 py-5 bg-white text-black text-sm uppercase tracking-widest hover:bg-gray-200 transition-all disabled:bg-white/20 disabled:text-white/40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                      Sending...
                    </>
                  ) : (
                    "Submit Message"
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
