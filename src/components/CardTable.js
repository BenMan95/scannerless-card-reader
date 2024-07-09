function CardTable(props) {
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
                {props.cards.map(card => (
                    <tr>
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