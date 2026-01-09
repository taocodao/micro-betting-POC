import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import './VideoPlayer.css';

interface VideoPlayerProps {
    onFrameHash?: (hash: string) => void;
}

// Local horse racing video from public folder (4K 50fps)
const LOCAL_VIDEO = '/14801999_3840_2160_50fps.mp4';

export function VideoPlayer({ onFrameHash }: VideoPlayerProps) {
    const { t } = useTranslation();
    const videoRef = useRef<HTMLVideoElement>(null);
    const [latency, setLatency] = useState(380);
    const [frameHash, setFrameHash] = useState('0x7a3b...');
    const [raceTime, setRaceTime] = useState('00:45');

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;
        video.play().catch(() => { });
    }, []);

    // Update stats
    useEffect(() => {
        let seconds = 45;
        const interval = setInterval(() => {
            const newLatency = 300 + Math.floor(Math.random() * 200);
            setLatency(newLatency);

            const chars = '0123456789abcdef';
            let hash = '0x';
            for (let i = 0; i < 8; i++) {
                hash += chars[Math.floor(Math.random() * chars.length)];
            }
            hash += '...';
            setFrameHash(hash);
            onFrameHash?.(hash);

            seconds++;
            if (seconds >= 120) seconds = 0;
            const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
            const secs = (seconds % 60).toString().padStart(2, '0');
            setRaceTime(`${mins}:${secs}`);
        }, 1000);

        return () => clearInterval(interval);
    }, [onFrameHash]);

    return (
        <div className="video-player">
            {/* Race Header */}
            <div className="race-header">
                <div className="race-name">🏇 Race 7 - Golden Stakes</div>
                <div className="race-time">{raceTime}</div>
            </div>

            {/* Live Badge */}
            <div className="live-badge">
                <span className="live-dot"></span>
                {t('video.liveIndicator')}
            </div>

            {/* Local Video */}
            <video
                ref={videoRef}
                className="video-element"
                src={LOCAL_VIDEO}
                autoPlay
                muted
                playsInline
                loop
            />

            {/* Info Overlay */}
            <div className="video-info">
                <div className="info-item">
                    <span className="info-label">{t('video.latency')}</span>
                    <span className={`info-value ${latency < 500 ? 'good' : 'warn'}`}>
                        {latency}ms
                    </span>
                </div>
                <div className="info-item">
                    <span className="info-label">{t('video.frameHash')}</span>
                    <span className="info-value hash">{frameHash}</span>
                </div>
            </div>

            {/* Caton Badge */}
            <div className="caton-note">
                ⚡ {t('video.lowLatencyNote')}
            </div>
        </div>
    );
}
