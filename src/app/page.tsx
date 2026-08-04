import Footer from "@/features/landing-page/Footer/components/Footer";
import HeroSection from "@/features/landing-page/hero-section/components/HeroSection";
import { Navbar } from "@/features/landing-page/navbar/components/Navbar";
import { Poppins } from "next/font/google";
const poppins = Poppins({
  weight: ["300", "400", "500", "700"],
  style: ["normal"],
  subsets: ["latin"],
});
export default function Home() {
  return (
    <>
      <Navbar />
      <div className={poppins.className}>
        <HeroSection />
        <Footer />
      </div>
    </>
  );
}
