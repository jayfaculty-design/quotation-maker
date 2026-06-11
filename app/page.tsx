// src/app/page.tsx
import BidWorkspace from "@/components/BidWorkspace";
import Image from "next/image";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-4">
        <header className="flex justify-between items-center border-b border-slate-200 pb-4">
          <div>
            <div className="flex items-center gap-3">
              <Image
                src="/bclogonew.png"
                alt="BC Medicals Ltd — Total Healthcare Solutions Provider"
                width={500}
                height={264}
                priority
                className=" w-[150px] h-auto object-contain"
              />
            </div>
            <p className="text-sm text-slate-500">
              Automated Document Assembly & Bid Calculation Engine
            </p>
          </div>
          <div className="bg-emerald-100 text-emerald-800 text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider">
            Operational Hub Node
            <span className="ml-2 inline-flex h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          </div>
        </header>

        <BidWorkspace />
      </div>
    </main>
  );
}
