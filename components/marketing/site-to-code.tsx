"use client";

import React, { useEffect, useState } from "react";
import { FileIcon, MoveRight } from "lucide-react";

export const SiteToCode = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [dataContentVisible, setDataContentVisible] = useState(false);
  const [arrowTranslate, setArrowTranslate] = useState(0);

  useEffect(() => {
    // Set initial visibility after component mounts
    setIsVisible(true);
    
    // Animate arrow
    const arrowInterval = setInterval(() => {
      setArrowTranslate((prev) => {
        const newValue = prev + 0.5;
        return newValue > 15 ? 0 : newValue;
      });
    }, 50);
    
    // Show data content with delay
    setTimeout(() => {
      setDataContentVisible(true);
    }, 600);
    
    return () => clearInterval(arrowInterval);
  }, []);

  return (
    <div className="relative max-w-6xl mx-auto py-10">
      <div className="flex flex-col lg:flex-row items-center justify-between gap-6 lg:gap-12">
        {/* Browser Windows */}
        <div 
          className="relative w-full lg:min-w-[420px]"
          style={{ opacity: isVisible ? 1 : 0, transition: "opacity 0.5s ease-in-out" }}
        >
          <div className="relative h-[250px] lg:h-[330px]" style={{ perspective: "1000px" }}>
            {/* Browser Window 3 (Bottom) */}
            <div 
              className="website-visual h-[250px] lg:h-[330px] absolute top-0 left-0 w-full p-4 bg-white rounded-xl shadow-[0_0_0_1px_rgba(0,0,0,0.08)] backdrop-blur-sm"
              style={{ 
                transformOrigin: "center top", 
                transform: isVisible ? "translateY(-20px) scale(0.9) translateZ(0px)" : "none", 
                zIndex: 1, 
                opacity: isVisible ? 1 : 0,
                transition: "transform 0.5s ease-out, opacity 0.5s ease-out"
              }}
            >
              <BrowserContent />
            </div>
            
            {/* Browser Window 2 (Middle) */}
            <div 
              className="website-visual h-[250px] lg:h-[330px] absolute top-0 left-0 w-full p-4 bg-white rounded-xl shadow-[0_0_0_1px_rgba(0,0,0,0.08)] backdrop-blur-sm"
              style={{ 
                transformOrigin: "center top", 
                transform: isVisible ? "translateY(-10px) scale(0.95) translateZ(0px)" : "none", 
                zIndex: 2, 
                opacity: isVisible ? 1 : 0,
                transition: "transform 0.5s ease-out, opacity 0.5s ease-out"
              }}
            >
              <BrowserContent />
            </div>
            
            {/* Browser Window 1 (Top) */}
            <div 
              className="website-visual h-[250px] lg:h-[330px] absolute top-0 left-0 w-full p-4 bg-white rounded-xl shadow-[0_0_0_1px_rgba(0,0,0,0.08)] backdrop-blur-sm"
              style={{ 
                transformOrigin: "center top", 
                transform: isVisible ? "none" : "translateY(-5px) scale(0.98)", 
                zIndex: 3, 
                opacity: 1,
                transition: "transform 0.5s ease-out"
              }}
            >
              <BrowserContent />
            </div>
          </div>
        </div>
        
        {/* Arrow */}
        <div 
          className="transform-arrow mb-2 lg:my-0 mr-2 rotate-90 lg:rotate-0">
          <div>
            <MoveRight className="text-white w-10 h-10" />
          </div>
        </div>
        
        {/* Next.js page.tsx File */}
        <div 
          className="relative w-full lg:min-w-[420px]"
          style={{ 
            opacity: isVisible ? 1 : 0,
            transition: "opacity 0.5s ease-in-out"
          }}
        >
          <div className="data-visual h-[330px] text-[13px] p-4 bg-[#0f111a] text-zinc-100 rounded-xl shadow-lg font-mono leading-relaxed overflow-auto">
            <div className="flex items-center gap-2 mb-3 text-zinc-400 border-b border-zinc-800 pb-3 sticky top-0 bg-[#0f111a] z-10">
              <div className="flex items-center gap-2">
                <FileIcon className="w-4 h-4" />
                <span className="text-sm text-zinc-400">app/page.tsx</span>
              </div>
            </div>
            
            <div className="data-content space-y-1.5 text-left" style={{ opacity: dataContentVisible ? 1 : 0, transition: "opacity 0.5s ease-in-out" }}>
              <CodeLine delay={100} text={<><span className="text-[#83d6f7]">import</span> <span className="text-[#babed8]"><span className="text-[#ffd502]">&#123;</span> Hero, Features, Pricing, Testimonials, CTA <span className="text-[#ffd502]">&#125;</span></span> <span className="text-[#83d6f7]">from</span> <span className="text-[#c2e78d]">"@/components"</span><span className="text-[#87dcfe]">;</span></>} />
              
              <div className="h-2"></div>
              
              <CodeLine delay={200} text={<><span className="text-[#83d6f7]">export</span> <span className="text-[#7ba2f2]">default</span> <span className="text-[#c792e9]">function</span> <span className="text-[#babed8]">Home</span><span className="text-[#ffd502]">()</span> <span className="text-[#e9c409]">&#123;</span></>} />
              <CodeLine delay={300} text={<><span className="ml-4 text-[#7ba2f2]">return</span> <span className="text-[#ffd502]">(</span></>} />
              <CodeLine delay={400} text={<><span className="ml-8 text-[#da70d6]">&lt;main</span> <span className="text-[#babed8]">className</span>=<span className="text-[#c2e78d]">"min-h-screen"</span><span className="text-[#da70d6]">&gt;</span></>} />
              <CodeLine delay={500} text={<><span className="ml-12 text-[#da70d6]">&lt;Hero</span> <span className="text-[#babed8]">title</span>=<span className="text-[#c2e78d]">"Clone Any Website to Next.js"</span> <span className="text-[#da70d6]">/&gt;</span></>} />
              <CodeLine delay={600} text={<><span className="ml-12 text-[#da70d6]">&lt;Features</span> <span className="text-[#babed8]">features</span>=<span className="text-[#c2e78d]">&#123;features&#125;</span> <span className="text-[#da70d6]">/&gt;</span></>} />
              <CodeLine delay={700} text={<><span className="ml-12 text-[#da70d6]">&lt;Testimonials</span> <span className="text-[#babed8]">testimonials</span>=<span className="text-[#c2e78d]">&#123;testimonials&#125;</span> <span className="text-[#da70d6]">/&gt;</span></>} />
              <CodeLine delay={800} text={<><span className="ml-12 text-[#da70d6]">&lt;Pricing</span> <span className="text-[#babed8]">plans</span>=<span className="text-[#c2e78d]">&#123;pricingPlans&#125;</span> <span className="text-[#da70d6]">/&gt;</span></>} />
              <CodeLine delay={900} text={<><span className="ml-12 text-[#da70d6]">&lt;CTA</span> <span className="text-[#babed8]">buttonText</span>=<span className="text-[#c2e78d]">"Get Started"</span> <span className="text-[#da70d6]">/&gt;</span></>} />
              <CodeLine delay={1000} text={<><span className="ml-8 text-[#da70d6]">&lt;/main&gt;</span></>} />
              <CodeLine delay={1100} text={<><span className="ml-4 text-[#ffd502]">)</span><span className="text-[#87dcfe]">;</span></>} />
              <CodeLine delay={1200} text={<><span className="text-[#e9c409]">&#125;</span></>} />            
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Browser content component
const BrowserContent = () => (
  <>
    <div className="browser-header flex items-center gap-2 border-b border-zinc-100 pb-3 mb-4">
      <div className="flex gap-1.5">
        <div className="w-3 h-3 rounded-full bg-[#FF5F57]"></div>
        <div className="w-3 h-3 rounded-full bg-[#FFBD2E]"></div>
        <div className="w-3 h-3 rounded-full bg-[#28CA41]"></div>
      </div>
      <div className="ml-3 flex-1 h-6 bg-zinc-100 rounded"></div>
    </div>
    <div className="website-content space-y-3">
      <div className="h-7 w-3/4 bg-zinc-100 rounded"></div>
      <div className="h-32 bg-zinc-100 rounded"></div>
      <div className="space-y-2 hidden lg:block">
        <div className="h-4 w-full bg-zinc-100 rounded"></div>
        <div className="h-4 w-5/6 bg-zinc-100 rounded"></div>
        <div className="h-4 w-4/6 bg-zinc-100 rounded"></div>
      </div>
    </div>
  </>
);

// Code line component with animation delay
const CodeLine = ({ delay, text }: { delay: number, text: React.ReactNode }) => {
  const [visible, setVisible] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(true);
    }, delay);
    
    return () => clearTimeout(timer);
  }, [delay]);
  
  return (
    <div 
      className="code-line" 
      style={{ 
        opacity: visible ? 1 : 0, 
        transform: visible ? "none" : "translateY(5px)", 
        transition: `opacity 0.3s ease-out ${delay/1000}s, transform 0.3s ease-out ${delay/1000}s` 
      }}
    >
      {text}
    </div>
  );
};