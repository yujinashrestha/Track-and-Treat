import Link from "next/link";

export default function Home() {
  return (
    <>
      {/* Decorative elements */}
      <div className="fixed top-0 left-0 w-full h-80 bg-linear-to-b from-emerald-100/50 to-transparent pointer-events-none"></div>
      <div className="fixed bottom-0 right-0 w-[500px] h-[500px] bg-lime-200/30 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="fixed top-20 left-10 w-96 h-96 bg-emerald-200/20 rounded-full blur-[100px] pointer-events-none"></div>

      {/* Main content */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-6 sm:p-12 overflow-hidden">
        <div className="max-w-4xl w-full text-center">
          {/* Logo Section */}
          <div className="mb-6 flex justify-center">
            <div className="w-24 h-24 bg-white rounded-3xl shadow-2xl shadow-emerald-200 flex items-center justify-center text-5xl transform hover:rotate-12 transition-all duration-500 cursor-default">
              🥗
            </div>
          </div>

          <div className="inline-block px-4 py-1.5 mb-6 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-black uppercase tracking-[0.2em] animate-bounce">
            Your Personal Health Partner
          </div>

          {/* Title with premium gradient */}
          <h1 className="text-7xl md:text-9xl font-black mb-6 tracking-tighter">
            <span className="bg-linear-to-br from-emerald-600 via-emerald-800 to-emerald-950 text-transparent bg-clip-text">Track</span>
            <span className="text-emerald-300 mx-2">&</span>
            <span className="bg-linear-to-tr from-lime-500 via-emerald-600 to-emerald-900 text-transparent bg-clip-text">Treat</span>
          </h1>

          {/* Premium Tagline */}
          <p className="text-xl md:text-2xl text-emerald-800/60 mb-12 max-w-2xl mx-auto font-medium leading-relaxed">
            Revolutionize your nutrition journey with precise tracking and <span className="text-emerald-900 font-bold underline decoration-lime-400 decoration-4">personalized rewards</span>.
          </p>

          {/* Features - Aesthetic Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <div className="group bg-white/40 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/60 shadow-xl shadow-emerald-900/[0.02] hover:bg-white hover:scale-105 transition-all duration-500">
              <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center text-2xl mb-6 shadow-inner group-hover:scale-110 transition-transform">📊</div>
              <h3 className="font-black text-emerald-950 mb-3 text-lg">Smart Tracking</h3>
              <p className="text-emerald-800/60 text-sm font-medium leading-loose">Precision logging for every macro and micro nutrient you consume.</p>
            </div>
            <div className="group bg-white/40 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/60 shadow-xl shadow-emerald-900/[0.02] hover:bg-white hover:scale-105 transition-all duration-500">
              <div className="w-14 h-14 bg-lime-100 rounded-2xl flex items-center justify-center text-2xl mb-6 shadow-inner group-hover:scale-110 transition-transform">🎯</div>
              <h3 className="font-black text-emerald-950 mb-3 text-lg">Goal Oriented</h3>
              <p className="text-emerald-800/60 text-sm font-medium leading-loose">Custom targets designed around your lifestyle and metabolism.</p>
            </div>
            <div className="group bg-white/40 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/60 shadow-xl shadow-emerald-900/[0.02] hover:bg-white hover:scale-105 transition-all duration-500">
              <div className="w-14 h-14 bg-emerald-900 text-white rounded-2xl flex items-center justify-center text-2xl mb-6 shadow-lg group-hover:scale-110 transition-transform">📈</div>
              <h3 className="font-black text-emerald-950 mb-3 text-lg">Deep Insights</h3>
              <p className="text-emerald-800/60 text-sm font-medium leading-loose">Visualization of your journey with informative graphs</p>
            </div>
          </div>

          {/* CTA Section */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <Link
              href="/login"
              className="group relative px-10 py-5 bg-emerald-900 text-white rounded-2xl font-black text-xl shadow-2xl shadow-emerald-900/20 transform hover:-translate-y-1 transition-all duration-300 w-full sm:w-auto overflow-hidden text-center"
            >
              <span className="relative z-10">Access Dashboard</span>
              <div className="absolute inset-0 bg-linear-to-r from-emerald-600 to-emerald-800 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </Link>

            <Link
              href="/register"
              className="px-10 py-5 bg-white text-emerald-900 rounded-2xl font-black text-xl shadow-xl shadow-emerald-900/5 hover:bg-emerald-50 transform hover:-translate-y-1 transition-all duration-300 border-2 border-emerald-900/10 w-full sm:w-auto text-center"
            >
              Start Your Journey
            </Link>
          </div>

          <div className="mt-20 flex items-center justify-center gap-8 opacity-40">
            <span className="font-black text-emerald-900 tracking-tighter text-2xl">VITA</span>
            <span className="font-black text-emerald-900 tracking-tighter text-2xl">PURE</span>
            <span className="font-black text-emerald-900 tracking-tighter text-2xl">ESSENCE</span>
          </div>
        </div>
      </div>
    </>
  );
}
