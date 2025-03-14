import type React from "react"
import { Copy, Pause } from "lucide-react"

interface CodeEditorProps {
  language: "python" | "nodejs" | "curl"
  code: string
}

const CodeEditor: React.FC<CodeEditorProps> = ({ language, code }) => {
  return (
    <div dir="ltr" className="relative w-full overflow-hidden rounded-xl border border-zinc-800 bg-[#1a1a1a] shadow-lg">
      <header className="flex h-14 items-center justify-between bg-[#1a1a1a] border-b border-zinc-800/50 px-4">
        <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide">
          <button
            className={`
            flex items-center gap-1 lg:gap-2 px-2 lg:px-3 py-1.5 lg:py-1.5 rounded-md text-xs lg:text-sm font-medium
            transition-colors duration-200
            ${language === "python" ? "text-orange-500 bg-orange-500/10" : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"}
          `}
          >
            <div className="w-4 h-4 mr-2">
              <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M5.79 1.574h3.866c.14 0 .252.11.252.246v5.186a.25.25 0 01-.252.246H6.344c-.975 0-1.766.77-1.766 1.72v1.162a.25.25 0 01-.253.243H1.867a.25.25 0 01-.253-.246V6.177a.25.25 0 01.252-.246H7.98c.418 0 .757-.33.757-.737a.747.747 0 00-.757-.738H5.537V1.82a.25.25 0 01.253-.246zm5.632 2.592V1.82c0-.95-.79-1.72-1.766-1.72H5.79c-.976 0-1.767.77-1.767 1.72v2.636H1.867C.89 4.456.1 5.226.1 6.176v3.955c0 .95.79 1.72 1.766 1.72h2.46c.085 0 .17-.006.252-.017v2.346c0 .95.79 1.72 1.766 1.72h3.866c.976 0 1.767-.77 1.767-1.72v-2.636h2.156c.976 0 1.767-.77 1.767-1.72V5.868c0-.95-.79-1.72-1.767-1.72h-2.458c-.086 0-.17.005-.253.017zm-5.33 5.974V8.994a.25.25 0 01.252-.246h3.312c.976 0 1.766-.77 1.766-1.72V5.866a.25.25 0 01.253-.243h2.458c.14 0 .253.11.253.246v3.954a.25.25 0 01-.252.246H8.02a.747.747 0 00-.757.737c0 .408.339.738.757.738h2.442v2.636a.25.25 0 01-.253.246H6.344a.25.25 0 01-.252-.246v-4.04z"
                  fill="currentColor"
                ></path>
              </svg>
            </div>
            Python
          </button>
          <button
            className={`
            flex items-center gap-1 lg:gap-2 px-2 lg:px-3 py-1.5 lg:py-1.5 rounded-md text-xs lg:text-sm font-medium
            transition-colors duration-200
            ${language === "nodejs" ? "text-orange-500 bg-orange-500/10" : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"}
          `}
          >
            <div className="w-4 h-4 mr-2">
              <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  fillRule="nonzero"
                  clipRule="nonzero"
                  d="M7.58638 0.102166C7.8199 -0.0340553 8.10867 -0.0340553 8.34219 0.102166L14.5565 3.72717C14.7869 3.86157 14.9286 4.10825 14.9286 4.375V11.625C14.9286 11.8918 14.7869 12.1384 14.5565 12.2728L8.34219 15.8978C8.10867 16.0341 7.8199 16.0341 7.58638 15.8978L6.03281 14.9916C5.67502 14.7829 5.55417 14.3236 5.76288 13.9658C5.97159 13.6081 6.43083 13.4872 6.78862 13.6959L7.96429 14.3817L13.4286 11.1942V4.80578L7.96429 1.61828L2.5 4.80578V11.1942L3.6168 11.8457C3.96098 11.9561 4.38611 11.9831 4.68576 11.8507C4.82477 11.7893 4.95031 11.6893 5.04968 11.5107C5.15426 11.3227 5.25 11.0098 5.25 10.5V5.25C5.25 4.83579 5.58579 4.5 6 4.5C6.41421 4.5 6.75 4.83579 6.75 5.25V10.5C6.75 11.1902 6.62104 11.7716 6.36047 12.2399C6.09471 12.7176 5.71466 13.036 5.29192 13.2228C4.48562 13.579 3.59523 13.433 3.04999 13.2371C3.00686 13.2216 2.96525 13.2022 2.92567 13.1791L1.3721 12.2728C1.14168 12.1384 1 11.8918 1 11.625V4.375C1 4.10825 1.14168 3.86157 1.3721 3.72717L7.58638 0.102166ZM8.24655 5.28323C8.64339 4.81081 9.26318 4.5 10.1042 4.5C10.8847 4.5 11.4792 4.76756 11.8815 5.19314C12.166 5.49417 12.1527 5.96885 11.8516 6.25338C11.5506 6.53792 11.0759 6.52455 10.7914 6.22352C10.7038 6.13087 10.5202 6 10.1042 6C9.66182 6 9.47952 6.14753 9.39511 6.24802C9.28615 6.37774 9.25 6.54184 9.25 6.625C9.25 6.70816 9.28615 6.87226 9.39511 7.00198C9.47952 7.10247 9.66182 7.25 10.1042 7.25C10.1782 7.25 10.2497 7.26073 10.3173 7.28072C10.9368 7.37001 11.4089 7.64784 11.7326 8.03323C12.1049 8.47643 12.2292 8.99983 12.2292 9.375C12.2292 9.75017 12.1049 10.2736 11.7326 10.7168C11.3358 11.1892 10.716 11.5 9.87501 11.5C9.0945 11.5 8.49996 11.2324 8.09768 10.8069C7.81315 10.5058 7.82652 10.0311 8.12755 9.74662C8.42857 9.46208 8.90325 9.47546 9.18779 9.77648C9.27536 9.86913 9.459 10 9.87501 10C10.3174 10 10.4997 9.85247 10.5841 9.75198C10.693 9.62226 10.7292 9.45816 10.7292 9.375C10.7292 9.29184 10.693 9.12774 10.5841 8.99802C10.4997 8.89753 10.3174 8.75 9.87501 8.75C9.80097 8.75 9.72943 8.73927 9.66188 8.71928C9.04237 8.62999 8.57028 8.35216 8.24655 7.96677C7.87427 7.52357 7.75 7.00017 7.75 6.625C7.75 6.24983 7.87427 5.72643 8.24655 5.28323Z"
                  fill="currentColor"
                ></path>
              </svg>
            </div>
            Node.js
          </button>
          <button
            className={`
            flex items-center gap-1 lg:gap-2 px-2 lg:px-3 py-1.5 lg:py-1.5 rounded-md text-xs lg:text-sm font-medium
            transition-colors duration-200
            ${language === "curl" ? "text-orange-500 bg-orange-500/10" : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"}
          `}
          >
            <div className="w-4 h-4 mr-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="lucide lucide-braces w-4 h-4"
              >
                <path d="M8 3H7a2 2 0 0 0-2 2v5a2 2 0 0 1-2 2 2 2 0 0 1 2 2v5c0 1.1.9 2 2 2h1"></path>
                <path d="M16 21h1a2 2 0 0 0 2-2v-5c0-1.1.9-2 2-2a2 2 0 0 1-2-2V5a2 2 0 0 0-2-2h-1"></path>
              </svg>
            </div>
            cURL
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2 rounded-md text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 transition-colors">
            <Copy className="w-4.5 h-4.5" />
          </button>
          <button className="hidden lg:block p-2 rounded-md text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 transition-colors">
            <Pause className="w-4.5 h-4.5" />
          </button>
        </div>
      </header>

      <div className="flex overflow-hidden scrollbar-hide h-[370px] scrollbar-thumb-zinc-700 scrollbar-track-transparent">
        <div className="flex-none py-4 pl-4 pr-2 text-right select-none font-mono w-[32px]">
          {Array.from({ length: 20 }).map((_, i) => (
            <div key={i} className="text-zinc-600 text-xs lg:text-sm leading-6">
              {i + 1}
            </div>
          ))}
        </div>
        <div className="overflow-auto pl-0 pr-4 w-full">
          <pre className="text-zinc-200 text-xs lg:text-sm leading-6">{code}</pre>
        </div>
      </div>
    </div>
  )
}

export default CodeEditor

