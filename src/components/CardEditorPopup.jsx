import { useEffect, useState } from 'react';
import styles from './CardEditorPopup.module.css';

function CardEditorPopup({card, onDelete, onCancel, onSave}) {
    const [cardData, setCardData] = useState();
    const [newCard, setNewCard] = useState({...card});

    return (
        <div className={styles['background']}>
            <div className={styles['window']}>
                <div className={styles['main']}>
                    <img></img>
                    <div className={styles['options']}>
                    </div>
                </div>
                <div className={styles['buttons']}>
                    <div className={styles['left']}>
                        <button onClick={onDelete}>Delete</button>
                    </div>
                    <div className={styles['right']}>
                        <button onClick={onCancel}>Cancel</button>
                        <button onClick={() => onSave(newCard)}>Save</button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default CardEditorPopup;