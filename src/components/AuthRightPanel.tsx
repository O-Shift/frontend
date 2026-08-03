import Image from 'next/image';
import OrangeWaveBackground from './OrangeWaveBackground';

export default function AuthRightPanel() {
    return (
        <div className="auth-right">
            {/* Full-screen orange route background */}
            <div className="auth-wave-container">
                <OrangeWaveBackground />
            </div>

            {/* Mascot — positioned in the right-center of the orange area */}
            <Image
                src="/mascot_running.png"
                alt="OShift Mascot"
                width={560}
                height={560}
                className="auth-mascot"
                priority
            />

            {/* Slogan — bottom-left of the orange area */}
            <div className="auth-slogan">
                <h2>
                    <span className="slogan-always">Always</span><br />
                    <span className="slogan-onestep">one step </span>
                    <span className="slogan-ahead">ahead</span>
                </h2>
            </div>
        </div>
    );
}
