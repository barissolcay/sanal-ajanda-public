/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
            },
            colors: {
                neon: {
                    indigo: '#6366F1',
                    cyan: '#22D3EE',
                    purple: '#A855F7',
                    pink: '#EC4899',
                }
            },
            animation: {
                'glow': 'glow 2s ease-in-out infinite alternate',
                'float': 'float 6s ease-in-out infinite',
                'fadeIn': 'fadeIn 0.3s ease-out forwards',
                'fadeInUp': 'fadeInUp 0.4s ease-out forwards',
                'fadeInDown': 'fadeInDown 0.3s ease-out forwards',
                'slideUp': 'slideUp 0.3s ease-out forwards',
                'slideDown': 'slideDown 0.3s ease-out forwards',
                'slideInRight': 'slideInRight 0.3s ease-out forwards',
                'slideInLeft': 'slideInLeft 0.3s ease-out forwards',
                'scaleIn': 'scaleIn 0.2s ease-out forwards',
                'scaleOut': 'scaleOut 0.2s ease-in forwards',
                'shimmer': 'shimmer 2s linear infinite',
                'pulseGlow': 'pulseGlow 2s ease-in-out infinite',
                'bounceIn': 'bounceIn 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards',
                'shake': 'shake 0.5s ease-in-out',
                'spin-slow': 'spin 3s linear infinite',
                'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'wiggle': 'wiggle 1s ease-in-out infinite',
                'gradient-x': 'gradient-x 3s ease infinite',
                'checkmark': 'checkmark 0.3s ease-out forwards',
            },
            keyframes: {
                glow: {
                    '0%': { boxShadow: '0 0 5px currentColor, 0 0 10px currentColor' },
                    '100%': { boxShadow: '0 0 10px currentColor, 0 0 20px currentColor, 0 0 30px currentColor' },
                },
                float: {
                    '0%, 100%': { transform: 'translateY(0px)' },
                    '50%': { transform: 'translateY(-20px)' },
                },
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                fadeInUp: {
                    '0%': { opacity: '0', transform: 'translateY(20px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                fadeInDown: {
                    '0%': { opacity: '0', transform: 'translateY(-10px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                slideUp: {
                    '0%': { opacity: '0', transform: 'translateY(100%)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                slideDown: {
                    '0%': { opacity: '0', transform: 'translateY(-100%)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                slideInRight: {
                    '0%': { opacity: '0', transform: 'translateX(100%)' },
                    '100%': { opacity: '1', transform: 'translateX(0)' },
                },
                slideInLeft: {
                    '0%': { opacity: '0', transform: 'translateX(-100%)' },
                    '100%': { opacity: '1', transform: 'translateX(0)' },
                },
                scaleIn: {
                    '0%': { opacity: '0', transform: 'scale(0.9)' },
                    '100%': { opacity: '1', transform: 'scale(1)' },
                },
                scaleOut: {
                    '0%': { opacity: '1', transform: 'scale(1)' },
                    '100%': { opacity: '0', transform: 'scale(0.9)' },
                },
                shimmer: {
                    '0%': { backgroundPosition: '-200% 0' },
                    '100%': { backgroundPosition: '200% 0' },
                },
                pulseGlow: {
                    '0%, 100%': {
                        boxShadow: '0 0 5px rgba(99, 102, 241, 0.5), 0 0 10px rgba(34, 211, 238, 0.3)'
                    },
                    '50%': {
                        boxShadow: '0 0 15px rgba(99, 102, 241, 0.8), 0 0 25px rgba(34, 211, 238, 0.5)'
                    },
                },
                bounceIn: {
                    '0%': { opacity: '0', transform: 'scale(0.3)' },
                    '50%': { transform: 'scale(1.05)' },
                    '70%': { transform: 'scale(0.95)' },
                    '100%': { opacity: '1', transform: 'scale(1)' },
                },
                shake: {
                    '0%, 100%': { transform: 'translateX(0)' },
                    '10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-4px)' },
                    '20%, 40%, 60%, 80%': { transform: 'translateX(4px)' },
                },
                wiggle: {
                    '0%, 100%': { transform: 'rotate(-3deg)' },
                    '50%': { transform: 'rotate(3deg)' },
                },
                'gradient-x': {
                    '0%, 100%': { backgroundPosition: '0% 50%' },
                    '50%': { backgroundPosition: '100% 50%' },
                },
                checkmark: {
                    '0%': { strokeDashoffset: '50' },
                    '100%': { strokeDashoffset: '0' },
                },
            },
            backdropBlur: {
                xs: '2px',
            },
            transitionTimingFunction: {
                'bounce-in': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
                'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
            },
            boxShadow: {
                'glow-sm': '0 0 10px rgba(99, 102, 241, 0.3)',
                'glow-md': '0 0 20px rgba(99, 102, 241, 0.4)',
                'glow-lg': '0 0 30px rgba(99, 102, 241, 0.5)',
                'glow-cyan': '0 0 20px rgba(34, 211, 238, 0.4)',
                'glow-purple': '0 0 20px rgba(168, 85, 247, 0.4)',
                'inner-glow': 'inset 0 0 20px rgba(99, 102, 241, 0.2)',
            },
        },
    },
    plugins: [],
};
