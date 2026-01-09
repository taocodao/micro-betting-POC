import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import './NarrationControls.css';

interface NarrationPhase {
    id: string;
    key: string;
}

const phases: NarrationPhase[] = [
    { id: 'intro', key: 'intro' },
    { id: 'video', key: 'video' },
    { id: 'x402', key: 'x402' },
    { id: 'brazil', key: 'brazil' },
    { id: 'dispute', key: 'dispute' },
    { id: 'blockchain', key: 'blockchain' },
    { id: 'compliance', key: 'compliance' },
    { id: 'architecture', key: 'architecture' },
    { id: 'closing', key: 'closing' },
];

const narrationScripts: Record<string, Record<string, string>> = {
    en: {
        intro: `Welcome to the next generation of regulated sports betting infrastructure. This platform operates on three revolutionary pillars: sub-500 millisecond low-latency video streaming, X402-based payment tracing that logs every transaction to blockchain while keeping settlement in fiat, and ERC-8004 trustless dispute resolution.`,
        video: `Traditional CDNs deliver video with 12 to 15 second delays. Caton C3 solves this through the Caton Video Pipeline. Each frame is hashed, creating a cryptographic fingerprint. The result is sub-500 millisecond end-to-end latency - a 24 to 30 times improvement over traditional CDNs.`,
        x402: `When you place a bet, your device captures the exact timestamp and signs it with EIP-712 cryptography. A trace record is written to blockchain. Payment settles through traditional rails like PIX in Brazil. This gives regulators complete traceability without cryptocurrency friction.`,
        brazil: `Brazil's regulated betting market generated 1.5 billion dollars in 2024 and will reach 3 billion by 2030. Sports betting accounts for 56% of all online gambling revenue. Our platform meets regulatory requirements natively.`,
        dispute: `With ERC-8004, all hashes are combined into a Merkle tree and committed to blockchain. When you dispute, a Trusted Execution Environment re-runs the decision logic and produces a signed attestation. The verdict is permanently recorded.`,
        blockchain: `Our platform uses three blockchain registries: X402 Trace Registry for payment records, ERC-8004 Identity Registry for operator identities, and Validation Registry for dispute attestations.`,
        compliance: `Brazil's Normative Ordinance 615 bans cryptocurrency for B2C betting. Our platform uses PIX and electronic transfers. B2B blockchain infrastructure for audit and compliance is explicitly allowed.`,
        architecture: `The user watches live racing in sub-500 millisecond latency, places a bet captured to the millisecond, and the platform records an immutable trace on blockchain. Disputes are resolved by TEE validation in seconds.`,
        closing: `By combining low-latency streaming, cryptographic payment tracing, and TEE-backed dispute resolution, we serve all stakeholders. Brazil is the proving ground. The technology is ready. Thank you for watching.`,
    },
    zh: {
        intro: `欢迎来到下一代受监管体育博彩基础设施。该平台基于三大革命性支柱：低于500毫秒的低延迟视频流、X402支付追踪，以及ERC-8004无信任争议解决方案。`,
        video: `传统CDN的视频延迟为12到15秒。Caton C3通过Caton视频管道解决了这个问题。每一帧都被哈希处理。结果是低于500毫秒的端到端延迟。`,
        x402: `当您下注时，您的设备捕获精确的时间戳并使用EIP-712加密签名。追踪记录被写入区块链。支付通过PIX等传统渠道结算。`,
        brazil: `巴西的受监管博彩市场在2024年创造了15亿美元，到2030年将达到30亿。体育博彩占所有在线赌博收入的56%。`,
        dispute: `使用ERC-8004，所有哈希被组合成Merkle树并提交到区块链。可信执行环境重新运行决策逻辑并生成签名证明。`,
        blockchain: `我们的平台使用三个区块链注册表：X402追踪注册表、ERC-8004身份注册表和验证注册表。`,
        compliance: `巴西第615号规范条例禁止B2C博彩使用加密货币。我们的平台使用PIX和电子转账。B2B区块链基础设施是允许的。`,
        architecture: `用户以低于500毫秒的延迟观看现场赛马，下注精确到毫秒，平台在区块链上记录不可变的追踪。`,
        closing: `通过结合低延迟流媒体、加密支付追踪和TEE支持的争议解决，我们服务于所有利益相关者。感谢观看。`,
    },
    pt: {
        intro: `Bem-vindo à próxima geração de infraestrutura de apostas esportivas regulamentadas. Esta plataforma opera em três pilares revolucionários: streaming de vídeo com latência inferior a 500 milissegundos, rastreamento X402, e resolução de disputas ERC-8004.`,
        video: `CDNs tradicionais entregam vídeo com atrasos de 12 a 15 segundos. O Caton C3 resolve isso através do Caton Video Pipeline. Cada frame é hasheado. O resultado é latência inferior a 500 milissegundos.`,
        x402: `Quando você faz uma aposta, seu dispositivo captura o timestamp exato e o assina com criptografia EIP-712. Um registro é escrito no blockchain. O pagamento é liquidado via PIX.`,
        brazil: `O mercado de apostas regulamentadas do Brasil gerou 1,5 bilhão de dólares em 2024 e alcançará 3 bilhões até 2030. As apostas esportivas representam 56% da receita.`,
        dispute: `Com ERC-8004, todos os hashes são combinados em uma árvore Merkle. Um Ambiente de Execução Confiável reexecuta a lógica e produz uma atestação assinada.`,
        blockchain: `Nossa plataforma usa três registros blockchain: Registro de Rastreio X402, Registro de Identidade ERC-8004 e Registro de Validação.`,
        compliance: `A Portaria 615 do Brasil proíbe criptomoeda para apostas B2C. Nossa plataforma usa PIX e transferências eletrônicas. Infraestrutura B2B blockchain é permitida.`,
        architecture: `O usuário assiste corridas com latência inferior a 500ms, faz apostas capturadas ao milissegundo, e a plataforma registra um rastreio imutável.`,
        closing: `Combinando streaming de baixa latência, rastreamento criptográfico e resolução TEE, atendemos todos os stakeholders. Obrigado por assistir.`,
    },
};

interface NarrationControlsProps {
    currentPhase: string;
    isPlaying: boolean;
    onPhaseSelect: (phaseId: string) => void;
    onPlayPause: () => void;
}

export function NarrationControls({
    currentPhase,
    isPlaying,
    onPhaseSelect,
    onPlayPause,
}: NarrationControlsProps) {
    const { t, i18n } = useTranslation();
    const [speaking, setSpeaking] = useState(false);
    const shouldStopRef = useRef(false);

    // Get voice based on language
    const getVoice = () => {
        const voices = window.speechSynthesis.getVoices();
        const lang = i18n.language;
        const langMap: Record<string, string> = { en: 'en', zh: 'zh', pt: 'pt' };
        return voices.find(v => v.lang.startsWith(langMap[lang] || 'en')) || voices[0];
    };

    // Speak a single phase (no auto-advance)
    const speak = (phaseId: string) => {
        window.speechSynthesis.cancel();
        shouldStopRef.current = false;

        const lang = i18n.language as 'en' | 'zh' | 'pt';
        const script = narrationScripts[lang]?.[phaseId] || narrationScripts.en[phaseId];

        if (!script) return;

        const utterance = new SpeechSynthesisUtterance(script);
        utterance.voice = getVoice();
        utterance.rate = 0.9;
        utterance.pitch = 1;

        utterance.onstart = () => setSpeaking(true);
        utterance.onend = () => setSpeaking(false);
        utterance.onerror = () => setSpeaking(false);

        window.speechSynthesis.speak(utterance);
    };

    // Stop speaking completely
    const stopSpeaking = () => {
        shouldStopRef.current = true;
        window.speechSynthesis.cancel();
        setSpeaking(false);
    };

    // Handle play/pause button
    const handlePlayPause = () => {
        if (speaking) {
            stopSpeaking();
        } else {
            speak(currentPhase);
        }
        onPlayPause();
    };

    // Handle phase selection
    const handlePhaseSelect = (phaseId: string) => {
        stopSpeaking();
        onPhaseSelect(phaseId);
    };

    // Clean up on unmount
    useEffect(() => {
        return () => {
            window.speechSynthesis.cancel();
        };
    }, []);

    // Load voices
    useEffect(() => {
        window.speechSynthesis.getVoices();
        const handleVoicesChanged = () => window.speechSynthesis.getVoices();
        window.speechSynthesis.addEventListener('voiceschanged', handleVoicesChanged);
        return () => window.speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged);
    }, []);

    return (
        <div className="narration-controls">
            <div className="narration-header">
                <span className="narration-title">🎙️ {t('narration.title')}</span>
                <button
                    className={`play-pause-btn ${speaking ? 'playing' : ''}`}
                    onClick={handlePlayPause}
                >
                    {speaking ? '⏹' : '▶'}
                    <span>{speaking ? t('narration.pause') : t('narration.play')}</span>
                </button>
            </div>

            <div className="phases-list">
                {phases.map((phase, index) => (
                    <button
                        key={phase.id}
                        className={`phase-btn ${currentPhase === phase.id ? 'active' : ''}`}
                        onClick={() => handlePhaseSelect(phase.id)}
                    >
                        <span className="phase-number">{index + 1}</span>
                        <span className="phase-name">{t(`narration.phases.${phase.key}`)}</span>
                    </button>
                ))}
            </div>

            {speaking && (
                <div className="speaking-indicator">
                    <span className="speaking-wave">🔊</span>
                    <span className="speaking-text">
                        {i18n.language === 'zh' ? '正在播放...' :
                            i18n.language === 'pt' ? 'Reproduzindo...' : 'Speaking...'}
                    </span>
                </div>
            )}
        </div>
    );
}
