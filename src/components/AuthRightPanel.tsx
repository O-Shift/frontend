import Image from 'next/image';
import OrangeWaveBackground from './OrangeWaveBackground';

export default function AuthRightPanel() {
    return (
        <div className="auth-right">
            {/* The responsive flowing SVG background */}
            <div className="auth-wave-container">
                <OrangeWaveBackground />
            </div>

            {/* Mascot */}
            <Image
                src="/mascot_running.png"
                alt="OShift Mascot"
                width={450}
                height={450}
                className="auth-mascot"
                priority
            />

            {/* Slogan */}
            <div className="auth-slogan">
                <h2>
                    Always<br />
                    one step <span className="slogan-bold">ahead</span>
                </h2>
            </div>
        </div>
    );
}
