import Image from 'next/image';
import OrangeWaveBackground from './OrangeWaveBackground';

export default function AuthRightPanel() {
    return (
        <div className="auth-right">
            {/* The responsive flowing SVG background */}
            <div className="auth-wave-container">
                <OrangeWaveBackground />
            </div>

            {/* Mascot + Slogan grouped so mascot sits directly above "Always" */}
            <div className="auth-mascot-slogan-group">
                <Image
                    src="/mascot_running.png"
                    alt="OShift Mascot"
                    width={550}
                    height={550}
                    className="auth-mascot"
                    priority
                />
                <div className="auth-slogan">
                    <h2>
                        Always<br />
                        one step <span className="slogan-bold">ahead</span>
                    </h2>
                </div>
            </div>
        </div>
    );
}
