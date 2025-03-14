import React from "react"

interface ResponsePanelProps {
  data: Record<string, any>
}

const ResponsePanel: React.FC<ResponsePanelProps> = ({ data }) => {
  return (
    <div className="relative w-full lg:min-w-[420px]" style={{ opacity: 1 }}>
      <div className="data-visual h-[280px] text-[11px] p-3 !h-[200px] border border-zinc-800 rounded-lg bg-[#1a1a1a] text-zinc-100 rounded-xl shadow-lg font-mono leading-relaxed overflow-hidden">
        <div className="flex items-center gap-2 mb-3 text-zinc-500 border-b border-zinc-800/50 pb-3">
          <div className="flex items-center gap-2">
            <svg className="w-3 h-3" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="12" fill="currentColor" opacity="0.2"></circle>
              <circle cx="12" cy="12" r="3" fill="currentColor"></circle>
            </svg>
            <span className="text-xs text-zinc-500">200 Response</span>
          </div>
        </div>
        <div style={{ opacity: 1, transform: "none" }}>
          <span className="text-orange-500">
            {JSON.stringify(data, null, 2)
              .split("\n")
              .map((line, i) => (
                <React.Fragment key={i}>
                  {line}
                  <br />
                </React.Fragment>
              ))}
          </span>
        </div>
      </div>
    </div>
  )
}

export default ResponsePanel

