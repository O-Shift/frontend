import Image from 'next/image';

export default function OrangeWaveBackground() {
    return (
        <Image
            src="/background-01.svg"
            alt=""
            fill
            style={{ objectFit: 'cover', objectPosition: 'center' }}
            className="orange-wave-bg"
            priority
        />
    );
}
