import styles from './CardTable.module.css';

function CardTable({cards, handleClick}) {
    return (
        <table>
            <thead>
                <tr>
                    <th>#</th>
                    <th>Name</th>
                    <th>Set</th>
                    <th>Num</th>
                    <th>Lang</th>
                    <th>Finish</th>
                </tr>
            </thead>
            <tbody>
                {cards.map((card, index) => (
                    <tr key={index} onClick={() => handleClick(card)}>
                        <td>{card.qty}</td>
                        <td>{card.name}</td>
                        <td>{card.set}</td>
                        <td>{card.cn}</td>
                        <td>{card.lang}</td>
                        <td>{card.finish}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    )
}

export default CardTable;