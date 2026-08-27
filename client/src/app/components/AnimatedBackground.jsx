import React from 'react';

export function AnimatedBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden -z-10">
      {/* Animated gradient base */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(-45deg, #ee7752, #e73c7e, #23a6d5, #23d5ab, #667eea, #764ba2)',
          backgroundSize: '400% 400%',
          animation: 'gradientShift 10s ease infinite'
        }}
      />
      
      {/* Animated floating circles */}
      <div className="absolute inset-0">
        {/* Circle 1 - Large, slow */}
        <div 
          style={{
            position: 'absolute',
            width: '500px',
            height: '500px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%)',
            top: '-100px',
            left: '-100px',
            animation: 'moveCircle1 20s linear infinite'
          }}
        />
        
        {/* Circle 2 - Medium, medium speed */}
        <div 
          style={{
            position: 'absolute',
            width: '400px',
            height: '400px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,255,255,0.25) 0%, transparent 70%)',
            bottom: '-50px',
            right: '-50px',
            animation: 'moveCircle2 15s linear infinite'
          }}
        />
        
        {/* Circle 3 - Small, fast */}
        <div 
          style={{
            position: 'absolute',
            width: '300px',
            height: '300px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,255,255,0.2) 0%, transparent 70%)',
            top: '30%',
            left: '50%',
            animation: 'moveCircle3 12s linear infinite'
          }}
        />
        
        {/* Circle 4 */}
        <div 
          style={{
            position: 'absolute',
            width: '250px',
            height: '250px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,255,255,0.2) 0%, transparent 70%)',
            top: '60%',
            left: '20%',
            animation: 'moveCircle4 18s linear infinite'
          }}
        />
        
        {/* Circle 5 */}
        <div 
          style={{
            position: 'absolute',
            width: '200px',
            height: '200px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%)',
            top: '10%',
            right: '20%',
            animation: 'moveCircle5 14s linear infinite'
          }}
        />
      </div>
      
      {/* Moving wave patterns */}
      <div 
        className="absolute inset-0 opacity-30"
        style={{
          background: `
            repeating-linear-gradient(
              45deg,
              transparent,
              transparent 100px,
              rgba(255,255,255,0.05) 100px,
              rgba(255,255,255,0.05) 200px
            )
          `,
          animation: 'moveWaves 30s linear infinite'
        }}
      />
      
      {/* Overlay for readability */}
      <div className="absolute inset-0 bg-white/60 dark:bg-black/70" />
      
      {/* Animation keyframes */}
      <style>{`
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        
        @keyframes moveCircle1 {
          0% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(100px, 150px) scale(1.1); }
          50% { transform: translate(200px, 50px) scale(1); }
          75% { transform: translate(50px, 200px) scale(0.9); }
          100% { transform: translate(0, 0) scale(1); }
        }
        
        @keyframes moveCircle2 {
          0% { transform: translate(0, 0) rotate(0deg); }
          25% { transform: translate(-150px, -100px) rotate(90deg); }
          50% { transform: translate(-100px, -200px) rotate(180deg); }
          75% { transform: translate(-200px, -50px) rotate(270deg); }
          100% { transform: translate(0, 0) rotate(360deg); }
        }
        
        @keyframes moveCircle3 {
          0% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(-200px, 100px) scale(1.2); }
          66% { transform: translate(100px, -150px) scale(0.8); }
          100% { transform: translate(0, 0) scale(1); }
        }
        
        @keyframes moveCircle4 {
          0% { transform: translate(0, 0); }
          20% { transform: translate(150px, -80px); }
          40% { transform: translate(100px, 120px); }
          60% { transform: translate(-50px, 80px); }
          80% { transform: translate(-100px, -50px); }
          100% { transform: translate(0, 0); }
        }
        
        @keyframes moveCircle5 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-150px, 150px) scale(1.3); }
        }
        
        @keyframes moveWaves {
          0% { background-position: 0 0; }
          100% { background-position: 200px 200px; }
        }
      `}</style>
    </div>
  );
}
