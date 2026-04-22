import { SignIn } from "@clerk/nextjs";
import { X } from "lucide-react";
import Link from "next/link";

export default function SignInPage() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#0a0a0a] p-4 relative">
      <div className="w-full max-w-[900px] h-auto min-h-[560px] bg-white rounded-2xl shadow-2xl flex overflow-hidden relative">
        
        {/* Left Side: Clerk Sign In */}
        <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center relative">
          <div className="w-full max-w-[340px] mx-auto">
            <h1 className="text-[32px] font-bold text-black mb-8 text-center tracking-tight">Welcome back</h1>
            
            <SignIn 
              appearance={{
                elements: {
                  rootBox: "w-full max-w-none",
                  card: "shadow-none border-0 p-0 m-0 w-full min-w-0 max-w-none bg-transparent rounded-none",
                  header: "hidden", // Hide clerk default header since we have custom one above
                  socialButtonsBlockButton: "border border-gray-900 bg-black text-white hover:bg-[#1a1a1a] flex-row-reverse justify-end gap-2 rounded-[14px] py-3.5 mb-3 font-semibold tracking-wide h-auto",
                  socialButtonsBlockButtonText: "font-semibold flex-1 text-center",
                  socialButtonsProviderIcon__google: "w-5 h-5 ml-4",
                  socialButtonsProviderIcon__apple: "w-5 h-5 ml-4 filter invert", // since background is black, maybe apple logo is white by default in clerk?
                  dividerRow: "my-6",
                  dividerLine: "bg-gray-200",
                  dividerText: "text-gray-400 font-medium text-[12px]",
                  formFieldLabel: "hidden",
                  formFieldInput: "bg-[#f5f5f5] border border-[#ebebeb] hover:border-[#d0d0d0] focus:border-[#ccc] flex-1 rounded-[14px] px-4 py-3.5 text-black placeholder:text-[#888] shadow-none outline-none mt-0 w-full h-auto text-[14px]",
                  formButtonPrimary: "bg-[#ebf3ff] text-[#2a80ff] hover:bg-[#dbe7ff] active:bg-[#c8d9ff] border-0 rounded-[14px] px-4 py-3.5 font-semibold text-[14px] shadow-none h-auto w-full mt-2 transition-colors",
                  footerAction: "hidden", // Hide sign up link
                  footer: "hidden"
                }
              }}
            />

            <div className="mt-8 text-center text-[#888] text-[12px] leading-relaxed">
              By continuing, you agree to Krea's<br />
              <Link href="#" className="text-[#2a80ff] hover:underline">Terms of Use</Link> & <Link href="#" className="text-[#2a80ff] hover:underline">Privacy Policy</Link>.
            </div>
          </div>
        </div>

        {/* Right Side: Image */}
        <div className="hidden md:block w-1/2 relative bg-[#f0f0f0]">
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url('https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=1400&auto=format&fit=crop')` }}
          />
          {/* Close Button matching Krea */}
          <Link href="/" className="absolute top-4 right-4 w-8 h-8 bg-black/20 hover:bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center transition-colors">
            <X size={16} className="text-white" />
          </Link>
        </div>
        
      </div>
    </div>
  );
}
