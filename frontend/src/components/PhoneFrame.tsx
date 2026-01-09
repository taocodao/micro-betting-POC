import { ReactNode } from 'react';
import './PhoneFrame.css';

interface PhoneFrameProps {
    children: ReactNode;
}

export function PhoneFrame({ children }: PhoneFrameProps) {
    return (
        <div className="phone-container">
            <div className="phone-frame">
                {/* Dynamic Island / Notch */}
                <div className="phone-notch">
                    <div className="notch-pill"></div>
                </div>

                {/* Screen Content */}
                <div className="phone-screen">
                    {children}
                </div>

                {/* Home Indicator */}
                <div className="phone-home-bar">
                    <div className="home-indicator"></div>
                </div>
            </div>
        </div>
    );
}
