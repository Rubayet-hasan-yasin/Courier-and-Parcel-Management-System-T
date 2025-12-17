declare module 'react-qr-scanner' {
    import * as React from 'react';

    export interface QrScannerProps {
        delay?: number;
        onError?: (error: any) => void;
        onScan?: (data: any) => void;
        style?: React.CSSProperties;
        constraints?: any;
        facingMode?: string;
        className?: string;
    }

    const QrScanner: React.ComponentType<QrScannerProps>;
    export default QrScanner;
}
