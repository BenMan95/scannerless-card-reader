interface Row {
    quantity: number,
    scryfall_id: string,
    card_name: string,
    set_code: string,
    collector_number: string,
    language: string,
    finish: string,
}

type PartialRow = Partial<Record<keyof Row, string>>;

interface ImportSettings {
    skip_first: boolean,
    columns: Partial<Record<keyof Row, number>>,
}

interface ExportSettings {
    write_headers: boolean,
    columns: [keyof Row, string][],
}

export type { Row, PartialRow, ImportSettings, ExportSettings };