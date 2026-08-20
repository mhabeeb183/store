import React from "react";

const Footer = () => {
  return (
    <footer className="bg-zinc-900 text-zinc-400 border-t border-zinc-800/80 py-12 px-6 mt-auto">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
        
        {/* Brand Info */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-white">
              <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <span className="text-lg font-black text-white uppercase tracking-tight">
              FreshCart
            </span>
          </div>
          <p className="text-zinc-500 text-xs leading-relaxed">
            Delivering organic, farm-fresh produce and daily household essentials to your doorstep with cutting-edge AI assistance.
          </p>
        </div>

        {/* Link Col 1 */}
        <div className="flex flex-col gap-3">
          <h4 className="text-white text-xs font-black uppercase tracking-wider">Product Categories</h4>
          <ul className="text-xs space-y-2 font-semibold">
            <li><a href="#" className="hover:text-emerald-400 transition">Fresh Vegetables</a></li>
            <li><a href="#" className="hover:text-emerald-400 transition">Organic Fruits</a></li>
            <li><a href="#" className="hover:text-emerald-400 transition">Dairy & Eggs</a></li>
            <li><a href="#" className="hover:text-emerald-400 transition">Instant Groceries</a></li>
          </ul>
        </div>

        {/* Link Col 2 */}
        <div className="flex flex-col gap-3">
          <h4 className="text-white text-xs font-black uppercase tracking-wider">Customer Support</h4>
          <ul className="text-xs space-y-2 font-semibold">
            <li><a href="#" className="hover:text-emerald-400 transition">Help Center</a></li>
            <li><a href="#" className="hover:text-emerald-400 transition">Track Orders</a></li>
            <li><a href="#" className="hover:text-emerald-400 transition">Returns & Refunds</a></li>
            <li><a href="#" className="hover:text-emerald-400 transition">Contact Us</a></li>
          </ul>
        </div>

        {/* Support Callout */}
        <div className="flex flex-col gap-3">
          <h4 className="text-white text-xs font-black uppercase tracking-wider">AI Assistant Support</h4>
          <p className="text-zinc-500 text-xs leading-relaxed">
            Need help finding matching products or comparing prices? Click the float bubble to chat with our smart bot widget.
          </p>
        </div>

      </div>

      <div className="max-w-7xl mx-auto border-t border-zinc-800/80 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-600 gap-4">
        <p>© {new Date().getFullYear()} FreshCart AI Market. All rights reserved.</p>
        <div className="flex gap-6 font-bold">
          <a href="#" className="hover:text-zinc-400 transition">Privacy Policy</a>
          <a href="#" className="hover:text-zinc-400 transition">Terms of Service</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;