import styles from './Popup.module.css';
import type { JSX } from 'react';

export interface PopupProps {
    children: JSX.Element;
}

function Popup({ children }: PopupProps) {
    return (
        <div className={styles['background']}>
            <div className={styles['window']}>
                {children}
            </div>
        </div>
    )
}

export default Popup;