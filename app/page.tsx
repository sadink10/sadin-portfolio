'use client';

import CanvasLoader from "./components/common/CanvasLoader";
import ScrollWrapper from "./components/common/ScrollWrapper";
import Experience from "./components/experience";
import Footer from "./components/footer";
import Hero from "./components/hero";
import GhostCursor from "./components/common/GhostCursor";

const noiseOverlayStyle = {
  backgroundColor: '#000000',
  backgroundBlendMode: "soft-light",
  backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 600 600'%3E%3Cfilter id='a'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23a)'/%3E%3C/svg%3E\")",
  backgroundRepeat: "repeat",
  backgroundSize: "100px",
};

const Home = () => {
  return (
    <main style={{ position: 'relative', width: '100%', minHeight: '100vh', ...noiseOverlayStyle }}>
      <GhostCursor 
        style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 1 }}
        color="#ffffff"
        brightness={0.7}
        trailLength={15}
        inertia={0.15}
        bloomStrength={0.05}
        grainIntensity={0.02}
      />
      <div style={{ position: 'relative', zIndex: 2 }}>
        <CanvasLoader>
          <ScrollWrapper>
            <Hero/>
            <Experience/>
            <Footer/>
          </ScrollWrapper>
        </CanvasLoader>
      </div>
    </main>
  );
};
export default Home;
