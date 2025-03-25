"use client";

import { Copy, DollarSign, Download, Pencil, Rocket } from "lucide-react";
import { Clock1 } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import { CodeBlock } from "../ui/code-block";

// Define the CSS keyframes animation for the scanning effect
const scanAnimationKeyframes = `
  @keyframes scanEffect {
    0% {
      background-position: 0 -100%;
    }
    100% {
      background-position: 0 100%;
    }
  }
`;

const Facts = () => {
  const [mounted, setMounted] = useState(false);
  const largeCardRef = useRef(null);
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Add the keyframes to the document head when the component mounts
    const styleElement = document.createElement('style');
    styleElement.innerHTML = scanAnimationKeyframes;
    document.head.appendChild(styleElement);
    
    // Clean up when the component unmounts
    return () => {
      if (styleElement.parentNode) {
        document.head.removeChild(styleElement);
      }
    };
  }, []);
  const code = `const Hero = () => {
  const [leads, setLeads] = React.useState(1250);

  const handleRequestDemo = () => {
    alert("Demo request submitted!");
  };

  return (
    <div className="p-8 bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg shadow-xl text-white">
      <h1 className="text-4xl font-bold mb-3">Supercharge Your Sales</h1>
      <p className="text-xl mb-6 text-blue-100">Join over <span className="font-semibold">{leads}</span> businesses using our CRM solution</p>
      <div className="flex gap-4 flex-wrap">
        <button 
          onClick={handleRequestDemo}
          className="px-6 py-3 bg-white text-blue-700 font-medium rounded-md hover:bg-blue-50 transition-colors"
        >
          Request Demo
        </button>
        <button className="px-6 py-3 border-2 border-white text-white rounded-md hover:bg-blue-700 transition-colors">
          Learn More
        </button>
      </div>
    </div>
  );
};
`;

const features = [
    {
      icon: Copy,
      title: 'Clone with Ease',
      description: 'Clone complex front-ends with ease directly into Next.js 14.',
      large: true
    },
    {
      icon: Rocket,
      title: 'One-Click Deployment',
      description: 'Deploy your cloned sites with a single click to Netlify.'
    },
    {
      icon: Clock1,
      title: 'Background Processing',
      description: 'No need to wait on the tab, we clone in the background.'
    },
    {
      icon: DollarSign,
      title: 'Cost Effective',
      description: 'Clone sites for completely free during our alpha.'
    },
    {
      icon: Pencil,
      title: 'Edit Online',
      description: 'Edit, delete, or revise what our AI clones in our web-editor.'
    },
    {
      icon: Download,
      title: 'Download',
      description: 'Download your cloned sites as a zip file, and use them as you want.'
    }
  ];

  return (
    <div className="mt-8 max-w-[390px] lg:max-w-6xl px-4 w-full mx-auto @container">
      <div className="relative flex flex-col items-center isolate @container rounded-[2rem] bg-[#FBFAF9] overflow-hidden @lg:py-12 px-4 w-full py-24 z-100">
        <div className="flex flex-col items-center max-w-3xl mx-auto mb-16">
          <div className="rounded-full border-[.75px] px-2.5 w-fit h-6 flex items-center text-xs font-medium border-[#E9E3DD] text-[#36322F] bg-[#FBFAF9] mb-4"
            style={{
              boxShadow: 'rgb(244, 241, 238) 0px -2.10843px 0px 0px inset, rgb(244, 241, 238) 0px 1.20482px 6.3253px 0px'
            }}>
            Zero Configuration
          </div>
          <h2 className="font-medium text-[2.3rem] @lg:text-[3rem] tracking-tight leading-[1.08] text-balance text-zinc-900 text-center">
            We handle the hard stuff
          </h2>
          <p className="text-base text-balance tracking-normal leading-normal mt-2 text-zinc-500 text-center max-w-2xl">
            Rotating proxies, orchestration, rate limits, js-blocked content and more
          </p>
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 auto-rows-fr gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className={`group relative overflow-hidden bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-sm rounded-[1.5rem] p-6 ${feature.large ? 'lg:col-span-2 lg:row-span-2' : 'p-5'
                  }`}
                style={{ opacity: mounted ? 1 : 0 }}
                ref={feature.large ? largeCardRef : null}
                onMouseEnter={() => feature.large && setIsHovering(true)}
                onMouseLeave={() => feature.large && setIsHovering(false)}
              >
                <div className="flex flex-col h-full gap-5">
                  <div className="pt-2 rounded-md w-fit">
                    {feature.icon && (
                      <feature.icon className="text-orange-600" size={24} />
                    )}
                  </div>
                  <div>
                    <h4 className="font-medium text-zinc-900 dark:text-zinc-100 text-base lg:text-lg mb-2">
                      {feature.title}
                    </h4>
                    <p className="text-zinc-500 dark:text-zinc-400 text-sm lg:text-base leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                  {feature.large && (
                    <div className="w-full h-[250px] mt-auto hidden lg:block relative">
                      <div className="website-animation-container relative w-full h-full overflow-hidden">
                        {/* Website skeleton that shows on hover */}
                        <div
                          className="website-visual h-[250px] lg:h-[330px] absolute top-0 left-0 w-full p-4 bg-zinc-800 rounded-xl shadow-[0_0_0_1px_rgba(0,0,0,0.08)] backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-500 ease-in-out transform group-hover:translate-y-0 group-hover:scale-100 group-hover:rotate-0 scale-95 translate-y-4 rotate-1"
                          style={{
                            transformOrigin: "center top",
                            zIndex: 3,
                            boxShadow: isHovering ? '0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01)' : 'none'
                          }}
                        >
                          <div className="browser-header flex items-center gap-2 border-b border-zinc-700 pb-3 mb-4">
                            <div className="flex gap-1.5">
                              <div className="w-3 h-3 rounded-full bg-[#FF5F57]" />
                              <div className="w-3 h-3 rounded-full bg-[#FFBD2E]" />
                              <div className="w-3 h-3 rounded-full bg-[#28CA41]" />
                            </div>
                            <div className="ml-3 flex-1 h-6 bg-zinc-700 rounded" />
                          </div>
                          <div className="website-content space-y-3">
                            <div className="justify-center whitespace-nowrap text-sm font-medium ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 dark:ring-offset-zinc-950 dark:focus-visible:ring-zinc-300 text-white dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-50/90 rounded-lg w-[300px] flex flex-col items-start text-left h-[50px] border text-wrap p-4 hover:bg-zinc-100/10 bg-zinc-700/20 border-zinc-100/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100" />
                            <div className="justify-center whitespace-nowrap text-sm font-medium ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 dark:ring-offset-zinc-950 dark:focus-visible:ring-zinc-300 text-white dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-50/90 rounded-lg w-[250px] flex flex-col items-start text-left h-[100px] border text-wrap p-4 hover:bg-zinc-100/10 bg-zinc-700/20 border-zinc-100/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-200" />
                            <div className="space-y-2 hidden lg:block">
                              <div className="justify-center whitespace-nowrap text-sm font-medium ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 dark:ring-offset-zinc-950 dark:focus-visible:ring-zinc-300 text-white dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-50/90 rounded-lg w-full flex flex-col items-start text-left h-[30px] border text-wrap p-4 hover:bg-zinc-100/10 bg-zinc-700/20 border-zinc-100/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-300" />
                              <div className="justify-center whitespace-nowrap text-sm font-medium ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 dark:ring-offset-zinc-950 dark:focus-visible:ring-zinc-300 text-white dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-50/90 rounded-lg w-5/6 flex flex-col items-start text-left h-[30px] border text-wrap p-4 hover:bg-zinc-100/10 bg-zinc-700/20 border-zinc-100/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-400" />
                              <div className="justify-center whitespace-nowrap text-sm font-medium ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 dark:ring-offset-zinc-950 dark:focus-visible:ring-zinc-300 text-white dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-50/90 rounded-lg w-4/6 flex flex-col items-start text-left h-[30px] border text-wrap p-4 hover:bg-zinc-100/10 bg-zinc-700/20 border-zinc-100/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-500" />
                            </div>
                          </div>
                        </div>
                        
                        {/* Scanning effect that appears when hovering */}
                        <div 
                          className="absolute inset-0 w-full h-full opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-300 delay-500 z-10" 
                          style={{
                            background: 'linear-gradient(to bottom, transparent, rgba(255, 255, 255, 0.07) 50%, transparent)',
                            backgroundSize: '100% 200%',
                            animation: isHovering ? 'scanEffect 1.5s linear infinite' : 'none'
                          }}
                        />
                        
                        {/* Code block that appears and slides in on hover */}
                        <div className="flex w-full items-end justify-start absolute bottom-0 left-0 transition-all duration-700 ease-in-out transform opacity-0 group-hover:opacity-100 group-hover:translate-y-16">
                          <div className="w-full max-w-3xl -ml-12 -mb-10 transition-all duration-700 ease-in-out transform translate-y-8 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 delay-300"
                               style={{
                                 filter: isHovering ? 'drop-shadow(0 4px 3px rgb(0 0 0 / 0.07)) drop-shadow(0 2px 2px rgb(0 0 0 / 0.06))' : 'none'
                               }}>
                            <CodeBlock
                              language="tsx"
                              filename="Hero.tsx"
                              highlightLines={[9, 13, 14, 18]}
                              code={code}
                            />
                          </div>
                        </div>
                        
                        {/* Default code block that shows initially and fades out on hover */}
                        <div className="flex w-full items-end justify-start absolute bottom-0 left-0 transition-all duration-300 ease-in-out transform opacity-100 group-hover:opacity-0 group-hover:translate-y-5">
                          <div className="w-full max-w-3xl -ml-12 -mb-10">
                            <CodeBlock
                              language="tsx"
                              filename="Hero.tsx"
                              highlightLines={[9, 13, 14, 18]}
                              code={code}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full max-w-5xl mx-auto mt-10 lg:mt-20">
            <div className="rounded-lg border border-zinc-200 text-zinc-950 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 p-0 bg-transparent border-none">
              <div className="p-2 flex items-center justify-center w-fit border border-zinc-100/10 rounded-lg bg-zinc-200/10 text-zinc-100">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width={20}
                  height={20}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="lucide lucide-blocks "
                >
                  <rect width={7} height={7} x={14} y={3} rx={1} />
                  <path d="M10 21V8a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-5a1 1 0 0 0-1-1H3" />
                </svg>
              </div>
              <h4 className="font-medium text-zinc-100 mt-4 mb-2">
                Use well-known tools
              </h4>
              <p className="text-sm text-zinc-400 mb-4">
                Already fully integrated with the greatest existing tools and workflows.
              </p>
              <div className="flex flex-wrap gap-3">
                <a
                  href="https://docs.llamaindex.ai/en/stable/examples/data_connectors/WebPageDemo/#using-firecrawl-reader/"
                  target="_blank"
                  className="hover:scale-105 hover:grayscale-0 grayscale transition-all duration-300"
                >
                  <img
                    src="/logos/llamaindex.svg"
                    alt="LlamaIndex"
                    className="h-8 w-auto"
                  />
                </a>
                <a
                  href="https://python.langchain.com/v0.2/docs/integrations/document_loaders/firecrawl/"
                  target="_blank"
                  className="hover:scale-105 hover:grayscale-0 grayscale transition-all duration-300"
                >
                  <img
                    src="/integrations/langchain.png"
                    alt="Langchain"
                    className="h-8 w-auto"
                  />
                </a>
                <a
                  href="https://dify.ai/blog/dify-ai-blog-integrated-with-firecrawl/"
                  target="_blank"
                  className="hover:scale-105 hover:grayscale-0 grayscale transition-all duration-300"
                >
                  <img src="/logos/dify.png" alt="Dify" className="h-8 w-auto" />
                </a>
                <a
                  href="https://www.langflow.org/"
                  target="_blank"
                  className="hover:scale-105 hover:grayscale-0 grayscale transition-all duration-300"
                >
                  <img
                    src="/integrations/langflow_2.png"
                    alt="Langflow"
                    className="h-8 w-auto"
                  />
                </a>
                <a
                  href="https://flowiseai.com/"
                  target="_blank"
                  className="hover:scale-105 hover:grayscale-0 grayscale transition-all duration-300"
                >
                  <img
                    src="/integrations/flowise.png"
                    alt="Flowise"
                    className="h-8 w-auto"
                  />
                </a>
                <a
                  href="https://crewai.com/"
                  target="_blank"
                  className="hover:scale-105 hover:grayscale-0 grayscale transition-all duration-300"
                >
                  <img
                    src="/integrations/crewai.png"
                    alt="CrewAI"
                    className="h-8 w-auto"
                  />
                </a>
                <a
                  href="https://docs.camel-ai.org/cookbooks/ingest_data_from_websites_with_Firecrawl.html"
                  target="_blank"
                  className="hover:scale-105 hover:grayscale-0 grayscale transition-all duration-300"
                >
                  <img
                    src="/integrations/camel-ai.png"
                    alt="Camel AI"
                    className="h-8 w-auto"
                  />
                </a>
              </div>
            </div>
            <div className="rounded-lg border border-zinc-200 text-zinc-950 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 p-0 bg-transparent border-none">
              <div className="p-2 flex items-center justify-center w-fit border border-zinc-100/10 rounded-lg bg-zinc-200/10 text-zinc-100">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width={20}
                  height={20}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="lucide lucide-piggy-bank "
                >
                  <path d="M19 5c-1.5 0-2.8 1.4-3 2-3.5-1.5-11-.3-11 5 0 1.8 0 3 2 4.5V20h4v-2h3v2h4v-4c1-.5 1.7-1 2-2h2v-4h-2c0-1-.5-1.5-1-2h0V5z" />
                  <path d="M2 9v1c0 1.1.9 2 2 2h1" />
                  <path d="M16 11h0" />
                </svg>
              </div>
              <h4 className="font-medium text-zinc-100 mt-4 mb-2">
                Start for free, scale easily
              </h4>
              <p className="text-sm text-zinc-400 mb-4">
                Kick off your journey for free and scale seamlessly as your project
                expands.
              </p>
              <a
                className="inline-flex items-center text-zinc-200 hover:text-zinc-100 transition-colors text-sm font-medium"
                href="/signin/signup"
              >
                Try it out{" "}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width={16}
                  height={16}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="lucide lucide-arrow-right ml-2"
                >
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
              </a>
            </div>
            <div className="rounded-lg border border-zinc-200 text-zinc-950 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 p-0 bg-transparent border-none">
              <div className="p-2 flex items-center justify-center w-fit border border-zinc-100/10 rounded-lg bg-zinc-200/10 text-zinc-100">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width={20}
                  height={20}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="lucide lucide-heart-handshake "
                >
                  <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                  <path d="M12 5 9.04 7.96a2.17 2.17 0 0 0 0 3.08v0c.82.82 2.13.85 3 .07l2.07-1.9a2.82 2.82 0 0 1 3.79 0l2.96 2.66" />
                  <path d="m18 15-2-2" />
                  <path d="m15 18-2-2" />
                </svg>
              </div>
              <h4 className="font-medium text-zinc-100 mt-4 mb-2">Open-source</h4>
              <p className="text-sm text-zinc-400 mb-4">
                Developed transparently and collaboratively. Join our community of
                contributors.
              </p>
              <a
                href="https://github.com/mendableai/firecrawl"
                target="_blank"
                className="inline-flex items-center text-zinc-200 hover:text-zinc-100 transition-colors text-sm font-medium"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width={16}
                  height={16}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="lucide lucide-github mr-2"
                >
                  <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
                  <path d="M9 18c-4.51 2-5-2-7-2" />
                </svg>{" "}
                Check out our repo
              </a>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default Facts;